/**
 * @file Fujin grammar for tree-sitter
 * Based on JavaScript and TypeScript grammars, adapted for Fujin's strict subset.
 * Actors instead of functions, emit for messaging.
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "fujin",

  externals: ($) => [$._automatic_semicolon],

  extras: ($) => [$.comment, /[\s\p{Zs}\uFEFF\u2028\u2029\u2060\u200B]/],

  reserved: {
    global: ($) => [
      "actor",
      "action",
      "assert",
      "break",
      "case",
      "catch",
      "const",
      "continue",
      "default",
      "else",
      "emit",
      "export",
      "false",
      "finally",
      "for",
      "if",
      "import",
      "let",
      "null",
      "switch",
      "throw",
      "true",
      "try",
      "type",
      "from",
      "as",
    ],
  },

  supertypes: ($) => [
    $.statement,
    $.declaration,
    $.expression,
    $.primary_expression,
    $.pattern,
    $.type,
  ],

  inline: ($) => [
    $._actor_signature,
    $._formal_parameter,
    $._expressions,
    $._semicolon,
    $._identifier,
    $._lhs_expression,
    $._type_identifier,
  ],

  precedences: ($) => [
    [
      "member",
      "call",
      $.update_expression,
      "unary_void",
      "binary_times",
      "binary_plus",
      "binary_relation",
      "binary_equality",
      "logical_and",
      "logical_or",
    ],
    ["assign", $.primary_expression],
    ["member", "call", $.expression],
    ["declaration", "literal"],
    [$.primary_expression, $.statement_block, "object"],
    [$.import_statement],
    [$.export_statement, $.primary_expression],
    [$.lexical_declaration, $.primary_expression],
    [$.type, $.primary_type],
    [$.union_type, "binary"],
  ],

  conflicts: ($) => [
    [$.primary_expression, $.pattern],
    [$.array, $.array_pattern],
    [$.object, $.object_pattern],
    [$.primary_expression, $.member_expression],
  ],

  word: ($) => $.identifier,

  rules: {
    program: ($) => seq(optional($.hash_bang_line), repeat($.statement)),

    hash_bang_line: (_) => /#!.*/,

    //
    // Declarations
    //

    declaration: ($) =>
      choice(
        $.actor_declaration,
        $.lexical_declaration,
        $.type_alias_declaration,
      ),

    lexical_declaration: ($) =>
      seq(
        field("kind", choice("let", "const")),
        commaSep1($.variable_declarator),
        $._semicolon,
      ),

    variable_declarator: ($) =>
      seq(
        field("name", choice($.identifier, $._destructuring_pattern)),
        field("type", optional($.type_annotation)),
        optional($._initializer),
      ),

    type_alias_declaration: ($) =>
      seq(
        "type",
        field("name", choice($._type_identifier, $.annotated_type_name)),
        field("type_parameters", optional($.type_parameters)),
        "=",
        field("value", $.type),
        $._semicolon,
      ),

    annotated_type_name: ($) =>
      seq(
        "@",
        field("annotation", $.identifier),
        "(",
        field("annotation_target", $._type_identifier),
        ")",
      ),

    //
    // Modules
    //

    import_statement: ($) =>
      seq(
        "import",
        choice(seq($.import_clause, $._from_clause), field("source", $.string)),
        $._semicolon,
      ),

    import_clause: ($) =>
      choice(
        $.namespace_import,
        $.named_imports,
        seq(
          $.identifier,
          optional(seq(",", choice($.namespace_import, $.named_imports))),
        ),
      ),

    _from_clause: ($) => seq("from", field("source", $.string)),

    namespace_import: ($) => seq("*", "as", $.identifier),

    named_imports: ($) =>
      seq("{", commaSep($.import_specifier), optional(","), "}"),

    import_specifier: ($) =>
      choice(
        field("name", $.identifier),
        seq(
          field("name", $._module_export_name),
          "as",
          field("alias", $.identifier),
        ),
      ),

    export_statement: ($) =>
      choice(
        seq(
          "export",
          choice(
            seq("*", $._from_clause),
            seq($.namespace_export, $._from_clause),
            seq($.export_clause, $._from_clause),
            $.export_clause,
          ),
          $._semicolon,
        ),
        seq(
          "export",
          choice(
            field("declaration", $.declaration),
            seq(
              "default",
              choice(
                field("declaration", $.declaration),
                seq(field("value", $.expression), $._semicolon),
              ),
            ),
          ),
        ),
      ),

    namespace_export: ($) => seq("*", "as", $._module_export_name),

    export_clause: ($) =>
      seq("{", commaSep($.export_specifier), optional(","), "}"),

    export_specifier: ($) =>
      seq(
        field("name", $._module_export_name),
        optional(seq("as", field("alias", $._module_export_name))),
      ),

    _module_export_name: ($) => choice($.identifier, $.string, "default"),

    //
    // Statements
    //

    statement: ($) =>
      choice(
        $.export_statement,
        $.import_statement,
        $.expression_statement,
        $.declaration,
        $.statement_block,
        $.if_statement,
        $.switch_statement,
        $.for_statement,
        $.try_statement,
        $.break_statement,
        $.continue_statement,
        $.emit_statement,
        $.assert_statement,
        $.throw_statement,
        $.empty_statement,
      ),

    expression_statement: ($) => seq($._expressions, $._semicolon),

    statement_block: ($) =>
      prec.right(
        seq("{", repeat($.statement), "}", optional($._automatic_semicolon)),
      ),

    if_statement: ($) =>
      prec.right(
        seq(
          "if",
          field("condition", $.parenthesized_expression),
          field("consequence", $.statement),
          optional(field("alternative", $.else_clause)),
        ),
      ),

    else_clause: ($) => seq("else", $.statement),

    switch_statement: ($) =>
      seq(
        "switch",
        field("value", $.parenthesized_expression),
        field("body", $.switch_body),
      ),

    switch_body: ($) =>
      seq("{", repeat(choice($.switch_case, $.switch_default)), "}"),

    switch_case: ($) =>
      seq(
        "case",
        field("value", $._expressions),
        ":",
        field("body", repeat($.statement)),
      ),

    switch_default: ($) =>
      seq("default", ":", field("body", repeat($.statement))),

    // ONLY C-style for loop allowed per Fujin docs
    for_statement: ($) =>
      seq(
        "for",
        "(",
        choice(
          field("initializer", $.lexical_declaration),
          seq(field("initializer", $._expressions), ";"),
          field("initializer", $.empty_statement),
        ),
        field("condition", choice(seq($._expressions, ";"), $.empty_statement)),
        field("increment", optional($._expressions)),
        ")",
        field("body", $.statement),
      ),

    try_statement: ($) =>
      seq(
        "try",
        field("body", $.statement_block),
        optional(field("handler", $.catch_clause)),
        optional(field("finalizer", $.finally_clause)),
      ),

    catch_clause: ($) =>
      seq(
        "catch",
        optional(
          seq(
            "(",
            field("parameter", choice($.identifier, $._destructuring_pattern)),
            ")",
          ),
        ),
        field("body", $.statement_block),
      ),

    finally_clause: ($) => seq("finally", field("body", $.statement_block)),

    break_statement: ($) => seq("break", $._semicolon),

    continue_statement: ($) => seq("continue", $._semicolon),

    // emit statement for sending messages
    emit_statement: ($) =>
      seq("emit", field("message", $.expression), $._semicolon),

    // assert statement for runtime checks
    assert_statement: ($) =>
      seq(
        "assert",
        field("condition", $.expression),
        optional(seq(",", field("message", $.expression))),
        $._semicolon,
      ),

    throw_statement: ($) => seq("throw", $._expressions, $._semicolon),

    empty_statement: (_) => ";",

    //
    // Expressions
    //

    _expressions: ($) => $.expression,

    expression: ($) =>
      choice(
        $.primary_expression,
        $.assignment_expression,
        $.augmented_assignment_expression,
        $.unary_expression,
        $.binary_expression,
        $.update_expression,
      ),

    primary_expression: ($) =>
      choice(
        $.subscript_expression,
        $.member_expression,
        $.parenthesized_expression,
        $._identifier,
        $.number,
        $.string,
        $.true,
        $.false,
        $.null,
        $.object,
        $.array,
        $.call_expression,
        $.action_identifier,
        $.meta_property,
        $.fjsx_element,
      ),

    parenthesized_expression: ($) => seq("(", $._expressions, ")"),

    object: ($) =>
      prec(
        "object",
        seq(
          "{",
          commaSep(
            optional(
              choice(
                $.pair,
                $.spread_element,
                alias($.identifier, $.shorthand_property_identifier),
              ),
            ),
          ),
          "}",
        ),
      ),

    spread_element: ($) => seq("...", $.expression),

    object_pattern: ($) =>
      prec(
        "object",
        seq(
          "{",
          commaSep(
            optional(
              choice(
                $.pair_pattern,
                alias($.identifier, $.shorthand_property_identifier_pattern),
              ),
            ),
          ),
          "}",
        ),
      ),

    array: ($) => seq("[", commaSep(optional($.expression)), "]"),

    array_pattern: ($) => seq("[", commaSep(optional($.pattern)), "]"),

    // Actor declaration - no return value
    actor_declaration: ($) =>
      prec.right(
        "declaration",
        seq(
          "actor",
          field(
            "name",
            choice($.action_identifier, sepBy1("|", $.action_identifier)),
          ),
          field("type_parameters", optional($.type_parameters)),
          field("parameters", optional($.formal_parameters)),
          field("body", $.statement_block),
          optional($._automatic_semicolon),
        ),
      ),

    _actor_signature: ($) =>
      seq(
        field("type_parameters", optional($.type_parameters)),
        field("parameters", $.formal_parameters),
      ),

    _formal_parameter: ($) => $.required_parameter,

    required_parameter: ($) =>
      seq(
        field("pattern", choice($.identifier, $._destructuring_pattern)),
        field("type", optional($.type_annotation)),
        optional($._initializer),
      ),

    call_expression: ($) =>
      choice(
        prec(
          "call",
          seq(field("function", $.expression), field("arguments", $.arguments)),
        ),
      ),

    member_expression: ($) =>
      prec(
        "member",
        seq(
          field(
            "object",
            choice($.expression, $.primary_expression, $.meta_property),
          ),
          ".",
          field("property", alias($.identifier, $.property_identifier)),
        ),
      ),

    meta_property: ($) => "@",

    subscript_expression: ($) =>
      prec.right(
        "member",
        seq(
          field("object", choice($.expression, $.primary_expression)),
          "[",
          field("index", $._expressions),
          "]",
        ),
      ),

    _lhs_expression: ($) =>
      choice(
        $.member_expression,
        $.subscript_expression,
        $._identifier,
        $._destructuring_pattern,
      ),

    assignment_expression: ($) =>
      prec.right(
        "assign",
        seq(
          field("left", choice($.parenthesized_expression, $._lhs_expression)),
          "=",
          field("right", $.expression),
        ),
      ),

    augmented_assignment_expression: ($) =>
      prec.right(
        "assign",
        seq(
          field("left", $._lhs_expression),
          field("operator", choice("+=", "-=", "*=", "/=", "%=")),
          field("right", $.expression),
        ),
      ),

    _initializer: ($) => seq("=", field("value", $.expression)),

    _destructuring_pattern: ($) => choice($.object_pattern, $.array_pattern),

    binary_expression: ($) =>
      choice(
        ...[
          ["&&", "logical_and"],
          ["||", "logical_or"],
          ["+", "binary_plus"],
          ["-", "binary_plus"],
          ["*", "binary_times"],
          ["/", "binary_times"],
          ["%", "binary_times"],
          ["<", "binary_relation"],
          ["<=", "binary_relation"],
          ["===", "binary_equality"],
          ["!==", "binary_equality"],
          [">=", "binary_relation"],
          [">", "binary_relation"],
        ].map(([operator, precedence, associativity]) =>
          (associativity === "right" ? prec.right : prec.left)(
            precedence,
            seq(
              field("left", $.expression),
              field("operator", operator),
              field("right", $.expression),
            ),
          ),
        ),
      ),

    unary_expression: ($) =>
      prec.left(
        "unary_void",
        seq(
          field("operator", choice("!", "-", "+")),
          field("argument", $.expression),
        ),
      ),

    update_expression: ($) =>
      prec.left(
        choice(
          seq(
            field("argument", $.expression),
            field("operator", choice("++", "--")),
          ),
          seq(
            field("operator", choice("++", "--")),
            field("argument", $.expression),
          ),
        ),
      ),

    //
    // Primitives
    //

    string: ($) =>
      choice(
        seq(
          '"',
          repeat(
            choice(
              alias($.unescaped_double_string_fragment, $.string_fragment),
              $.escape_sequence,
            ),
          ),
          '"',
        ),
        seq(
          "'",
          repeat(
            choice(
              alias($.unescaped_single_string_fragment, $.string_fragment),
              $.escape_sequence,
            ),
          ),
          "'",
        ),
      ),

    unescaped_double_string_fragment: (_) =>
      token.immediate(prec(1, /[^"\\\r\n]+/)),

    unescaped_single_string_fragment: (_) =>
      token.immediate(prec(1, /[^'\\\r\n]+/)),

    escape_sequence: (_) =>
      token.immediate(
        seq(
          "\\",
          choice(
            /[^xu0-7]/,
            /[0-7]{1,3}/,
            /x[0-9a-fA-F]{2}/,
            /u[0-9a-fA-F]{4}/,
            /u\{[0-9a-fA-F]+\}/,
            /[\r?][\n\u2028\u2029]/,
          ),
        ),
      ),

    comment: (_) =>
      token(
        choice(
          seq("//", /[^\r\n\u2028\u2029]*/),
          seq("/*", /[^*]*\*+([^/*][^*]*\*+)*/, "/"),
        ),
      ),

    number: (_) => {
      const hexLiteral = seq(choice("0x", "0X"), /[\da-fA-F](_?[\da-fA-F])*/);
      const decimalDigits = /\d(_?\d)*/;
      const signedInteger = seq(optional(choice("-", "+")), decimalDigits);
      const exponentPart = seq(choice("e", "E"), signedInteger);
      const binaryLiteral = seq(choice("0b", "0B"), /[0-1](_?[0-1])*/);
      const octalLiteral = seq(choice("0o", "0O"), /[0-7](_?[0-7])*/);

      const decimalIntegerLiteral = choice(
        "0",
        seq(
          optional("0"),
          /[1-9]/,
          optional(seq(optional("_"), decimalDigits)),
        ),
      );

      const decimalLiteral = choice(
        seq(
          decimalIntegerLiteral,
          ".",
          optional(decimalDigits),
          optional(exponentPart),
        ),
        seq(".", decimalDigits, optional(exponentPart)),
        seq(decimalIntegerLiteral, exponentPart),
        decimalDigits,
      );

      return token(
        choice(hexLiteral, decimalLiteral, binaryLiteral, octalLiteral),
      );
    },

    _identifier: ($) => $.identifier,

    identifier: (_) => {
      const alpha =
        /[^\x00-\x1F\s\p{Zs}0-9:;`"'@#.,|^&<=>+\-*/\\%?!~()\[\]{}\uFEFF\u2060\u200B\u2028\u2029]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\}/;
      const alphanumeric =
        /[^\x00-\x1F\s\p{Zs}:;`"'@#.,|^&<=>+\-*/\\%?!~()\[\]{}\uFEFF\u2060\u200B\u2028\u2029]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\}/;
      return token(seq(alpha, repeat(alphanumeric)));
    },

    // Reference to actor (e.g., @click)
    action_identifier: (_) =>
      token(
        seq(
          "@",
          /[^\x00-\x1F\s\p{Zs}:;`"'@#.,|^&<=>+\-*/\\%?!~()\[\]{}\uFEFF\u2060\u200B\u2028\u2029]+/,
        ),
      ),

    true: (_) => "true",
    false: (_) => "false",
    null: (_) => "null",

    //
    // Components
    //

    arguments: ($) => seq("(", commaSep(optional($.expression)), ")"),

    formal_parameters: ($) =>
      seq(
        "(",
        optional(seq(commaSep1($._formal_parameter), optional(","))),
        ")",
      ),

    pattern: ($) => prec.dynamic(-1, $._lhs_expression),

    pair: ($) =>
      seq(field("key", $._property_name), ":", field("value", $.expression)),

    pair_pattern: ($) =>
      seq(field("key", $._property_name), ":", field("value", $.pattern)),

    _property_name: ($) =>
      choice(
        alias($.identifier, $.property_identifier),
        alias($.reserved_identifier, $.property_identifier),
        $.action_identifier,
        $.string,
        $.number,
      ),

    reserved_identifier: (_) =>
      choice(
        "type",
        "actor",
        "assert",
        "emit",
        "import",
        "export",
        "const",
        "let",
        "if",
        "else",
        "for",
        "switch",
        "case",
        "default",
        "break",
        "continue",
        "try",
        "catch",
        "finally",
        "throw",
        "true",
        "false",
        "null",
        "action",
        "from",
        "as",
      ),

    _semicolon: ($) => choice($._automatic_semicolon, ";"),

    //
    // Types
    //

    type_annotation: ($) => seq(":", $.type),

    type: ($) =>
      choice($.primary_type, $.union_type, $.actor_type, $.array_type),

    primary_type: ($) =>
      choice(
        $._type_identifier,
        $.predefined_type,
        $.generic_type,
        $.object_type,
        $.literal_type,
      ),

    predefined_type: (_) =>
      choice(
        "u8",
        "u16",
        "u32",
        "u64",
        "i8",
        "i16",
        "i32",
        "i64",
        "f32",
        "f64",
        "bool",
        "byte",
        "string",
        "action",
        "number",
        "void",
      ),

    _type_identifier: ($) => alias($.identifier, $.type_identifier),

    generic_type: ($) =>
      prec(
        "call",
        seq(
          field("name", $._type_identifier),
          field("type_arguments", $.type_arguments),
        ),
      ),

    type_arguments: ($) => seq("<", commaSep1($.type), optional(","), ">"),
    type_parameters: ($) =>
      seq("<", commaSep1($.type_parameter), optional(","), ">"),

    type_parameter: ($) => seq(field("name", $._type_identifier)),

    object_type: ($) =>
      seq(
        "{",
        optional(
          seq(
            optional(choice(",", ";")),
            seq(
              $.property_signature,
              repeat(
                seq(optional(choice(",", $._semicolon)), $.property_signature),
              ),
            ),
            optional(choice(",", $._semicolon)),
          ),
        ),
        "}",
      ),

    property_signature: ($) =>
      seq(
        field("name", $._property_name),
        optional("?"),
        field("type", optional($.type_annotation)),
      ),

    array_type: ($) => seq($.primary_type, "[", "]"),

    union_type: ($) => prec.left(seq(optional($.type), "|", $.type)),

    // Actor type - takes parameters, no return
    actor_type: ($) =>
      prec.left(
        seq(
          field("type_parameters", optional($.type_parameters)),
          field("parameters", $.formal_parameters),
          "=>",
          "void",
        ),
      ),

    literal_type: ($) => choice($.number, $.string, $.true, $.false, $.null),

    //
    // FJX (lightweight JSX-like syntax)
    //
    fjsx_element: ($) =>
      choice($.fjsx_self_closing_element, $.fjsx_standard_element),

    fjsx_standard_element: ($) =>
      seq(
        "<",
        field("name", $._fjsx_tag_name),
        repeat($.fjsx_attribute),
        ">",
        optional($.fjsx_children),
        "</",
        field("closing_name", $._fjsx_tag_name),
        ">",
      ),

    fjsx_self_closing_element: ($) =>
      seq("<", field("name", $._fjsx_tag_name), repeat($.fjsx_attribute), "/>"),

    _fjsx_tag_name: ($) => choice($.identifier, $.action_identifier),

    fjsx_attribute: ($) =>
      seq(
        field("name", choice($.identifier, $.action_identifier)),
        "=",
        field(
          "value",
          choice(
            $.string,
            $.number,
            $.true,
            $.false,
            $.null,
            $.action_identifier,
            seq("{", $.expression, "}"),
          ),
        ),
      ),

    fjsx_children: ($) =>
      repeat1(choice($.fjsx_element, $.fjsx_text, $.fjsx_expression_child)),

    fjsx_text: (_) => token.immediate(/[^{<]+/),

    fjsx_expression_child: ($) => seq("{", $.expression, "}"),
  },
});

function commaSep1(rule) {
  return seq(rule, repeat(seq(",", rule)));
}

function commaSep(rule) {
  return optional(commaSep1(rule));
}

function sepBy1(sep, rule) {
  return seq(rule, repeat(seq(sep, rule)));
}
