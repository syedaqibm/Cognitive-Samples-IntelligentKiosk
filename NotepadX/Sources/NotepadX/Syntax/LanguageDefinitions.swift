import Foundation

extension LanguageDefinition {
    private static var cache: [Language: LanguageDefinition] = [:]

    static func definition(for language: Language) -> LanguageDefinition {
        if let cached = cache[language] { return cached }
        let definition = build(for: language)
        cache[language] = definition
        return definition
    }

    private static func build(for language: Language) -> LanguageDefinition {
        var def = LanguageDefinition()
        switch language {
        case .plainText:
            def.stringDelimiters = ""
            def.highlightNumbers = false
            def.highlightFunctionCalls = false

        case .swift:
            def.keywords = [
                "associatedtype", "class", "deinit", "enum", "extension", "fileprivate", "func",
                "import", "init", "inout", "internal", "let", "open", "operator", "private",
                "protocol", "public", "static", "struct", "subscript", "typealias", "var",
                "break", "case", "continue", "default", "defer", "do", "else", "fallthrough",
                "for", "guard", "if", "in", "repeat", "return", "switch", "where", "while",
                "as", "catch", "is", "rethrows", "throw", "throws", "try", "async", "await",
                "actor", "some", "any", "lazy", "weak", "unowned", "mutating", "nonmutating",
                "override", "required", "convenience", "final", "indirect", "get", "set", "willSet", "didSet"
            ]
            def.types = [
                "Int", "Int8", "Int16", "Int32", "Int64", "UInt", "Double", "Float", "CGFloat",
                "String", "Bool", "Character", "Array", "Dictionary", "Set", "Optional",
                "Result", "Error", "Void", "Any", "AnyObject", "Self", "URL", "Data", "Date"
            ]
            def.constants = ["true", "false", "nil", "self", "super"]
            def.lineComments = ["//"]
            def.blockComments = [("/*", "*/")]
            def.stringDelimiters = "\""
            def.multilineStrings = true
            def.extraPatterns = [
                ("@\\w+", .attribute),
                ("#\\w+", .preprocessor)
            ]

        case .python:
            def.keywords = [
                "and", "as", "assert", "async", "await", "break", "class", "continue", "def",
                "del", "elif", "else", "except", "finally", "for", "from", "global", "if",
                "import", "in", "is", "lambda", "nonlocal", "not", "or", "pass", "raise",
                "return", "try", "while", "with", "yield", "match", "case"
            ]
            def.types = [
                "int", "float", "complex", "str", "bool", "list", "dict", "set", "tuple",
                "bytes", "bytearray", "object", "type", "Exception", "BaseException", "range"
            ]
            def.constants = ["True", "False", "None", "self", "cls", "__name__", "__main__"]
            def.lineComments = ["#"]
            def.stringDelimiters = "\"'"
            def.multilineStrings = true
            def.indentTriggers = ":"
            def.extraPatterns = [
                ("@[\\w.]+", .attribute)
            ]

        case .javascript:
            def.keywords = javaScriptKeywords
            def.types = [
                "Array", "Boolean", "Date", "Error", "JSON", "Map", "Math", "Number", "Object",
                "Promise", "Proxy", "RegExp", "Set", "String", "Symbol", "WeakMap", "WeakSet",
                "console", "document", "window", "globalThis"
            ]
            def.constants = ["true", "false", "null", "undefined", "NaN", "Infinity", "this"]
            def.lineComments = ["//"]
            def.blockComments = [("/*", "*/")]
            def.stringDelimiters = "\"'`"
            def.multilineStrings = true

        case .typescript:
            def.keywords = javaScriptKeywords + [
                "interface", "type", "enum", "namespace", "declare", "implements", "private",
                "public", "protected", "readonly", "abstract", "keyof", "infer", "satisfies", "asserts"
            ]
            def.types = [
                "string", "number", "boolean", "object", "void", "any", "unknown", "never",
                "Array", "Promise", "Record", "Partial", "Required", "Readonly", "Pick", "Omit",
                "Map", "Set", "console"
            ]
            def.constants = ["true", "false", "null", "undefined", "NaN", "Infinity", "this"]
            def.lineComments = ["//"]
            def.blockComments = [("/*", "*/")]
            def.stringDelimiters = "\"'`"
            def.multilineStrings = true
            def.extraPatterns = [
                ("@\\w+", .attribute)
            ]

        case .c:
            def.keywords = cKeywords
            def.types = [
                "size_t", "ssize_t", "ptrdiff_t", "intptr_t", "uintptr_t", "int8_t", "int16_t",
                "int32_t", "int64_t", "uint8_t", "uint16_t", "uint32_t", "uint64_t", "FILE", "bool"
            ]
            def.constants = ["NULL", "true", "false", "EOF", "stdin", "stdout", "stderr"]
            def.lineComments = ["//"]
            def.blockComments = [("/*", "*/")]
            def.extraPatterns = [
                ("^\\s*#\\s*\\w+", .preprocessor)
            ]

        case .cpp:
            def.keywords = cKeywords + [
                "class", "namespace", "template", "typename", "using", "virtual", "override",
                "final", "public", "private", "protected", "new", "delete", "this", "throw",
                "try", "catch", "operator", "friend", "constexpr", "consteval", "constinit",
                "decltype", "explicit", "export", "mutable", "noexcept", "static_cast",
                "dynamic_cast", "const_cast", "reinterpret_cast", "concept", "requires", "co_await",
                "co_return", "co_yield"
            ]
            def.types = [
                "std", "string", "vector", "map", "set", "unordered_map", "unordered_set",
                "shared_ptr", "unique_ptr", "weak_ptr", "pair", "tuple", "optional", "variant",
                "size_t", "int8_t", "int16_t", "int32_t", "int64_t", "uint8_t", "uint16_t",
                "uint32_t", "uint64_t"
            ]
            def.constants = ["NULL", "nullptr", "true", "false"]
            def.lineComments = ["//"]
            def.blockComments = [("/*", "*/")]
            def.extraPatterns = [
                ("^\\s*#\\s*\\w+", .preprocessor)
            ]

        case .csharp:
            def.keywords = [
                "abstract", "as", "base", "break", "case", "catch", "checked", "class", "const",
                "continue", "default", "delegate", "do", "else", "enum", "event", "explicit",
                "extern", "finally", "fixed", "for", "foreach", "goto", "if", "implicit", "in",
                "interface", "internal", "is", "lock", "namespace", "new", "operator", "out",
                "override", "params", "private", "protected", "public", "readonly", "ref",
                "return", "sealed", "sizeof", "stackalloc", "static", "struct", "switch", "this",
                "throw", "try", "typeof", "unchecked", "unsafe", "using", "virtual", "void",
                "volatile", "while", "async", "await", "record", "get", "set", "var", "when",
                "where", "yield", "partial", "init"
            ]
            def.types = [
                "bool", "byte", "char", "decimal", "double", "float", "int", "long", "object",
                "sbyte", "short", "string", "uint", "ulong", "ushort", "Console", "List",
                "Dictionary", "Task", "String", "Object", "Exception", "IEnumerable"
            ]
            def.constants = ["true", "false", "null"]
            def.lineComments = ["//"]
            def.blockComments = [("/*", "*/")]
            def.extraPatterns = [
                ("^\\s*#\\w+", .preprocessor),
                ("\\[\\w+(\\(.*?\\))?\\]", .attribute)
            ]

        case .java:
            def.keywords = [
                "abstract", "assert", "break", "case", "catch", "class", "const", "continue",
                "default", "do", "else", "enum", "extends", "final", "finally", "for", "goto",
                "if", "implements", "import", "instanceof", "interface", "native", "new",
                "package", "private", "protected", "public", "return", "static", "strictfp",
                "super", "switch", "synchronized", "this", "throw", "throws", "transient",
                "try", "volatile", "while", "var", "record", "sealed", "permits", "yield"
            ]
            def.types = [
                "boolean", "byte", "char", "double", "float", "int", "long", "short", "void",
                "String", "Integer", "Long", "Double", "Boolean", "List", "Map", "Set",
                "ArrayList", "HashMap", "HashSet", "Object", "System", "Exception", "Optional", "Stream"
            ]
            def.constants = ["true", "false", "null"]
            def.lineComments = ["//"]
            def.blockComments = [("/*", "*/")]
            def.extraPatterns = [
                ("@\\w+", .attribute)
            ]

        case .kotlin:
            def.keywords = [
                "as", "break", "class", "continue", "do", "else", "for", "fun", "if", "in",
                "interface", "is", "object", "package", "return", "super", "this", "throw",
                "try", "typealias", "val", "var", "when", "while", "by", "catch", "constructor",
                "delegate", "finally", "get", "import", "init", "set", "where", "abstract",
                "annotation", "companion", "const", "crossinline", "data", "enum", "expect",
                "external", "final", "infix", "inline", "inner", "internal", "lateinit",
                "noinline", "open", "operator", "out", "override", "private", "protected",
                "public", "reified", "sealed", "suspend", "tailrec", "vararg"
            ]
            def.types = [
                "Int", "Long", "Double", "Float", "Boolean", "String", "Char", "Byte", "Short",
                "List", "Map", "Set", "MutableList", "MutableMap", "Array", "Unit", "Any", "Nothing", "Pair"
            ]
            def.constants = ["true", "false", "null"]
            def.lineComments = ["//"]
            def.blockComments = [("/*", "*/")]
            def.stringDelimiters = "\""
            def.multilineStrings = true
            def.extraPatterns = [
                ("@\\w+", .attribute)
            ]

        case .go:
            def.keywords = [
                "break", "case", "chan", "const", "continue", "default", "defer", "else",
                "fallthrough", "for", "func", "go", "goto", "if", "import", "interface", "map",
                "package", "range", "return", "select", "struct", "switch", "type", "var"
            ]
            def.types = [
                "bool", "byte", "complex64", "complex128", "error", "float32", "float64",
                "int", "int8", "int16", "int32", "int64", "rune", "string", "uint", "uint8",
                "uint16", "uint32", "uint64", "uintptr", "any"
            ]
            def.constants = ["true", "false", "nil", "iota"]
            def.lineComments = ["//"]
            def.blockComments = [("/*", "*/")]
            def.stringDelimiters = "\"'`"
            def.multilineStrings = true

        case .rust:
            def.keywords = [
                "as", "async", "await", "break", "const", "continue", "crate", "dyn", "else",
                "enum", "extern", "fn", "for", "if", "impl", "in", "let", "loop", "match",
                "mod", "move", "mut", "pub", "ref", "return", "static", "struct", "super",
                "trait", "type", "unsafe", "use", "where", "while"
            ]
            def.types = [
                "bool", "char", "f32", "f64", "i8", "i16", "i32", "i64", "i128", "isize",
                "str", "u8", "u16", "u32", "u64", "u128", "usize", "String", "Vec", "Option",
                "Result", "Box", "Rc", "Arc", "RefCell", "HashMap", "HashSet", "Self"
            ]
            def.constants = ["true", "false", "self", "Some", "None", "Ok", "Err"]
            def.lineComments = ["//"]
            def.blockComments = [("/*", "*/")]
            def.stringDelimiters = "\""
            def.multilineStrings = true
            def.extraPatterns = [
                ("#!?\\[[^\\]\\n]*\\]", .attribute),
                ("\\b[a-z_][a-z0-9_]*!", .preprocessor),
                ("'\\w+\\b", .type)
            ]

        case .ruby:
            def.keywords = [
                "BEGIN", "END", "alias", "and", "begin", "break", "case", "class", "def",
                "do", "else", "elsif", "end", "ensure", "for", "if", "in", "module", "next",
                "not", "or", "redo", "rescue", "retry", "return", "then", "undef", "unless",
                "until", "when", "while", "yield", "require", "require_relative",
                "attr_accessor", "attr_reader", "attr_writer", "puts", "print", "raise",
                "lambda", "proc", "include", "extend", "new"
            ]
            def.types = ["Array", "Hash", "String", "Integer", "Float", "Symbol", "Range", "Struct", "Class", "Module"]
            def.constants = ["true", "false", "nil", "self", "super", "__FILE__", "__LINE__"]
            def.lineComments = ["#"]
            def.blockComments = [("=begin", "=end")]
            def.multilineStrings = false
            def.extraPatterns = [
                (":\\w+", .constant),
                ("@{1,2}\\w+", .attribute),
                ("\\$\\w+", .attribute)
            ]

        case .php:
            def.keywords = [
                "abstract", "and", "array", "as", "break", "callable", "case", "catch", "class",
                "clone", "const", "continue", "declare", "default", "do", "echo", "else",
                "elseif", "empty", "enum", "extends", "final", "finally", "fn", "for",
                "foreach", "function", "global", "goto", "if", "implements", "include",
                "include_once", "instanceof", "insteadof", "interface", "isset", "list",
                "match", "namespace", "new", "or", "print", "private", "protected", "public",
                "readonly", "require", "require_once", "return", "static", "switch", "throw",
                "trait", "try", "unset", "use", "var", "while", "xor", "yield"
            ]
            def.types = ["int", "float", "string", "bool", "object", "mixed", "void", "iterable", "self", "parent"]
            def.constants = ["true", "false", "null", "TRUE", "FALSE", "NULL", "PHP_EOL"]
            def.lineComments = ["//", "#"]
            def.blockComments = [("/*", "*/")]
            def.multilineStrings = true
            def.extraPatterns = [
                ("\\$\\w+", .attribute),
                ("<\\?php|\\?>", .preprocessor)
            ]

        case .shell:
            def.keywords = [
                "if", "then", "else", "elif", "fi", "for", "while", "until", "do", "done",
                "case", "esac", "function", "in", "select", "time", "break", "continue",
                "return", "exit", "local", "declare", "export", "readonly", "shift", "source",
                "alias", "unalias", "set", "unset", "trap", "eval", "exec", "cd", "echo",
                "printf", "read", "test", "sudo", "grep", "sed", "awk"
            ]
            def.constants = ["true", "false"]
            def.lineComments = ["#"]
            def.multilineStrings = true
            def.extraPatterns = [
                ("\\$\\{[^}\\n]*\\}", .attribute),
                ("\\$\\w+", .attribute),
                ("\\$\\(", .attribute)
            ]

        case .sql:
            def.keywords = [
                "SELECT", "FROM", "WHERE", "INSERT", "INTO", "VALUES", "UPDATE", "SET",
                "DELETE", "CREATE", "TABLE", "ALTER", "DROP", "INDEX", "VIEW", "JOIN",
                "INNER", "LEFT", "RIGHT", "FULL", "OUTER", "CROSS", "ON", "AS", "AND", "OR",
                "NOT", "NULL", "IS", "IN", "LIKE", "BETWEEN", "EXISTS", "UNION", "ALL",
                "DISTINCT", "GROUP", "BY", "ORDER", "HAVING", "LIMIT", "OFFSET", "CASE",
                "WHEN", "THEN", "ELSE", "END", "PRIMARY", "FOREIGN", "KEY", "REFERENCES",
                "DEFAULT", "UNIQUE", "CHECK", "CONSTRAINT", "DATABASE", "PROCEDURE",
                "FUNCTION", "TRIGGER", "BEGIN", "COMMIT", "ROLLBACK", "TRANSACTION", "GRANT",
                "REVOKE", "IF", "CASCADE", "ASC", "DESC", "WITH", "RETURNING"
            ]
            def.types = [
                "VARCHAR", "INT", "INTEGER", "BIGINT", "SMALLINT", "DECIMAL", "NUMERIC",
                "FLOAT", "REAL", "DOUBLE", "CHAR", "TEXT", "DATE", "TIME", "TIMESTAMP",
                "BOOLEAN", "BLOB", "SERIAL", "UUID", "JSON", "JSONB"
            ]
            def.constants = ["TRUE", "FALSE", "NULL"]
            def.lineComments = ["--"]
            def.blockComments = [("/*", "*/")]
            def.caseInsensitiveKeywords = true
            def.multilineStrings = true

        case .html:
            def.blockComments = [("<!--", "-->")]
            def.highlightNumbers = false
            def.highlightFunctionCalls = false
            def.extraPatterns = [
                ("</?\\s*[a-zA-Z][a-zA-Z0-9-]*", .keyword),
                ("/?>", .keyword),
                ("\\b[a-zA-Z-]+(?==)", .attribute),
                ("&\\w+;", .constant),
                ("<!DOCTYPE[^>]*>", .preprocessor)
            ]

        case .xml:
            def.blockComments = [("<!--", "-->")]
            def.highlightNumbers = false
            def.highlightFunctionCalls = false
            def.extraPatterns = [
                ("</?\\s*[a-zA-Z_][\\w.:-]*", .keyword),
                ("/?>", .keyword),
                ("\\b[\\w:-]+(?==)", .attribute),
                ("&\\w+;", .constant),
                ("<\\?[^>\\n]*\\?>", .preprocessor)
            ]

        case .css:
            def.lineComments = ["//"]
            def.blockComments = [("/*", "*/")]
            def.highlightFunctionCalls = true
            def.extraPatterns = [
                ("\\b[a-z-]+(?=\\s*:)", .keyword),
                ("[.#][\\w-]+", .type),
                ("@[\\w-]+", .attribute),
                ("#[0-9a-fA-F]{3,8}\\b", .number),
                ("\\b\\d+(?:\\.\\d+)?(?:px|em|rem|vh|vw|pt|s|ms|deg|fr)\\b", .number),
                ("!important", .preprocessor)
            ]

        case .json:
            def.constants = ["true", "false", "null"]
            def.stringDelimiters = "\""
            def.highlightFunctionCalls = false

        case .yaml:
            def.constants = ["true", "false", "null", "yes", "no", "on", "off"]
            def.caseInsensitiveKeywords = true
            def.lineComments = ["#"]
            def.highlightFunctionCalls = false
            def.extraPatterns = [
                ("^\\s*[\\w.-]+(?=\\s*:)", .keyword),
                ("[&*]\\w+", .attribute),
                ("^---$|^\\.\\.\\.$", .preprocessor)
            ]

        case .markdown:
            def.stringDelimiters = ""
            def.highlightNumbers = false
            def.highlightFunctionCalls = false
            def.extraPatterns = [
                ("^#{1,6}[ \\t].*$", .keyword),
                ("^\\s{0,3}(?:[-*+]|\\d+\\.)[ \\t]", .number),
                ("\\*\\*[^*\\n]+\\*\\*", .type),
                ("`[^`\\n]+`", .string),
                ("^```.*$", .string),
                ("\\[[^\\]\\n]*\\]\\([^)\\n]*\\)", .function),
                ("^>.*$", .comment),
                ("^(?:-{3,}|\\*{3,}|_{3,})\\s*$", .preprocessor)
            ]

        case .objectiveC:
            def.keywords = cKeywords + [
                "@interface", "@implementation", "@end", "@property", "@synthesize",
                "@dynamic", "@protocol", "@class", "@selector", "@encode", "@synchronized",
                "@autoreleasepool", "@try", "@catch", "@finally", "@throw", "id", "instancetype",
                "self", "super", "nonatomic", "atomic", "strong", "weak", "copy", "assign",
                "readonly", "readwrite"
            ]
            def.types = ["NSString", "NSArray", "NSDictionary", "NSNumber", "NSObject", "NSInteger", "NSUInteger", "CGFloat", "BOOL"]
            def.constants = ["YES", "NO", "nil", "NULL", "true", "false"]
            def.lineComments = ["//"]
            def.blockComments = [("/*", "*/")]
            def.extraPatterns = [
                ("^\\s*#\\s*\\w+", .preprocessor),
                ("@\\w+", .keyword),
                ("\\bNS[A-Z]\\w*", .type)
            ]
        }
        return def
    }

    private static let javaScriptKeywords = [
        "break", "case", "catch", "class", "const", "continue", "debugger", "default",
        "delete", "do", "else", "export", "extends", "finally", "for", "function", "if",
        "import", "in", "instanceof", "let", "new", "of", "return", "static", "super",
        "switch", "throw", "try", "typeof", "var", "void", "while", "with", "yield",
        "async", "await", "get", "set", "from", "as"
    ]

    private static let cKeywords = [
        "auto", "break", "case", "char", "const", "continue", "default", "do", "double",
        "else", "enum", "extern", "float", "for", "goto", "if", "inline", "int", "long",
        "register", "restrict", "return", "short", "signed", "sizeof", "static", "struct",
        "switch", "typedef", "union", "unsigned", "void", "volatile", "while"
    ]
}
