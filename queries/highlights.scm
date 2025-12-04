; Errors - highlight parsing errors
(ERROR) @error

; Comments
(comment) @comment

; String literals
(string) @string
(template_string) @string
(escape_sequence) @string.escape
(template_substitution) @embedded

; Numbers
(number) @number

; Booleans and null
(true) @constant.builtin
(false) @constant.builtin
(null) @constant.builtin

; Type identifiers
(type_identifier) @type
(predefined_type) @type.builtin

; Type declarations
(type_alias_declaration
  name: (type_identifier) @type.definition)
(interface_declaration
  name: (type_identifier) @type.definition)

; Function declarations
(function_declaration
  name: (identifier) @function.definition)
(function_expression
  name: (identifier) @function)
(arrow_function) @function

; Function calls
(call_expression
  function: (identifier) @function.call)
(call_expression
  function: (member_expression
    property: (property_identifier) @function.method))

; Method signatures
(method_signature
  name: (property_identifier) @function.method)

; Properties
(property_signature
  name: (property_identifier) @property)
(property_identifier) @property
(shorthand_property_identifier) @property

; Parameters
(required_parameter
  pattern: (identifier) @variable.parameter)
(optional_parameter
  pattern: (identifier) @variable.parameter)

; Variables
(identifier) @variable

; Operators
"=" @operator
"==" @operator
"===" @operator
"!=" @operator
"!==" @operator
">" @operator
">=" @operator
"<" @operator
"<=" @operator
"+" @operator
"-" @operator
"*" @operator
"/" @operator
"%" @operator
"**" @operator
"++" @operator
"--" @operator
"&&" @operator
"||" @operator
"!" @operator
"??" @operator
"?." @operator
"&" @operator
"|" @operator
"^" @operator
"~" @operator
"<<" @operator
">>" @operator
">>>" @operator
"+=" @operator
"-=" @operator
"*=" @operator
"/=" @operator
"%=" @operator
"**=" @operator
"<<=" @operator
">>=" @operator
">>>=" @operator
"&=" @operator
"|=" @operator
"^=" @operator
"&&=" @operator
"||=" @operator
"??=" @operator

; Punctuation
"(" @punctuation.bracket
")" @punctuation.bracket
"[" @punctuation.bracket
"]" @punctuation.bracket
"{" @punctuation.bracket
"}" @punctuation.bracket
";" @punctuation.delimiter
"," @punctuation.delimiter
"." @punctuation.delimiter
":" @punctuation.delimiter
"?" @punctuation.special
"=>" @punctuation.special

; Keywords
"as" @keyword
"async" @keyword
"await" @keyword
"break" @keyword
"case" @keyword
"catch" @keyword
"const" @keyword
"continue" @keyword
"default" @keyword
"else" @keyword
"export" @keyword
"extends" @keyword
"finally" @keyword
"for" @keyword
"from" @keyword
"function" @keyword.function
"if" @keyword
"import" @keyword
"interface" @keyword
"let" @keyword
"readonly" @keyword
"return" @keyword
"switch" @keyword
"throw" @keyword
"try" @keyword
"type" @keyword
"void" @keyword
