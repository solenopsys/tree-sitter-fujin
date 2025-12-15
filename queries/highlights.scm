; Errors - highlight parsing errors
(ERROR) @error

; Comments
(comment) @comment

; String literals
(string) @string
(escape_sequence) @string.escape

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

; Actor declarations
(actor_declaration
  name: (action_identifier) @function.definition)

; Function calls
(call_expression
  function: (identifier) @function.call)
(call_expression
  function: (member_expression
    property: (property_identifier) @function.method))

; Properties
(property_signature
  name: (property_identifier) @property)
(property_identifier) @property
(shorthand_property_identifier) @property

; Parameters
(required_parameter
  pattern: (identifier) @variable.parameter)

; Variables
(identifier) @variable

; Action identifiers
(action_identifier) @function

; Keywords
"actor" @keyword
"as" @keyword
"assert" @keyword
"break" @keyword
"case" @keyword
"catch" @keyword
"const" @keyword
"continue" @keyword
"default" @keyword
"else" @keyword
"emit" @keyword
"export" @keyword
"finally" @keyword
"for" @keyword
"from" @keyword
"if" @keyword
"import" @keyword
"let" @keyword
"switch" @keyword
"throw" @keyword
"try" @keyword
"type" @keyword
