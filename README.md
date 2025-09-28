# Yantrabhashi Validator

This project implements a browser-based validator for the Yantrabhashi toy programming language. It uses a tokenizer + LL(1) recursive-descent parser to check both syntax and semantic rules and provides feedback in a simple UI.

## 🔄 Flow of Code

### 1. Tokenization (tokenize)

- Strips comments (#).

- Splits the source into tokens:

    - Keywords: PADAM, ANKHE, VARTTAI, ELAITHE, ALAITHE, MALLI-MALLI, CHATIMPU, CHEPPU.

    - Symbols: =, +, -, *, /, ==, !=, <, <=, etc.

    - Identifiers: variable names.

    - Literals: "strings" and numbers.

- Attaches line and column positions for error reporting.

### 2. Parser (LL(1))

- Program → multiple statements until EOF.

- Statement dispatcher chooses based on the first token:

    - PADAM → variable declaration.

    - IDENT → assignment.

    - CHATIMPU → print.

    - CHEPPU → input.

    - ELAITHE → if/else.

    - MALLI-MALLI → loop.

### 3. Symbol Table & Scoping

- Maintains a stack of scopes (symbols array).

- On PADAM, variables are declared with a type (ANKHE int, VARTTAI string).

- Prevents duplicate declarations in the same scope.

- Ensures variables are declared before use.

### 4. Semantic Checks

- Type mismatch on assignments:

    - Numbers only to ANKHE.

    - Strings only to VARTTAI.

- Conditions:

    - Relational ops (<, >, <=, >=) → integers only.

    - Equality ops (==, !=) → types on both sides must match.

- Loops:

    - Must initialize with PADAM.

    - Update step must explicitly reassign the loop var.

- Input (CHEPPU) must target declared variables.

### 5. UI (index.html + styles.css)

- Textarea for code input.

- Validate button runs parser and shows:

    - ✅ No errors.

    - ❌ Errors with line/column and message.

- Shows token dump for debugging.

## 📜 Parser Logic (Step by Step)

### Declarations

> PADAM a:ANKHE = 1;
>
> PADAM msg:VARTTAI = "Hello";


- Declares variable a as integer, msg as string.

- Reports error if type mismatch at initialization.

### Assignments

> a = 10;


- Looks up a in symbol table.

- Checks type compatibility.

### Print (CHATIMPU)

> CHATIMPU("Sum is:", a);


- Accepts string literals, variables, or numeric expressions.

- Reports undeclared identifier if used.

### Input (CHEPPU)

> CHEPPU(a);

- Only valid if a is declared.

### Conditionals

```
ELAITHE (a < 5) [
CHATIMPU("ok");
] ALAITHE [
CHATIMPU("no");
]
```

- Condition checked for type correctness.

- Both blocks must be enclosed in [ and ].

### Loops

```
MALLI-MALLI (PADAM i:ANKHE = 0; i < 3; i = i + 1) [
CHATIMPU(i);
]
```


- Initialization must use PADAM.

- Update must modify loop var.

- Scope created for loop-local variables.

## 📘 Examples (from assignment)

Example 1 — Hello World
```
PADAM message:VARTTAI = "Hello World";
CHATIMPU(message);
```

Example 2 — Sum of Two Numbers
```
PADAM a:ANKHE;
PADAM b:ANKHE;
PADAM sum:ANKHE = 0;

CHEPPU(a);
CHEPPU(b);

sum = a + b;

CHATIMPU("The Sum is:");
CHATIMPU(sum);
```

Example 3 — Conditional

```
PADAM username:VARTTAI;
CHEPPU(username);

ELAITHE (username == "Anirudh") [
CHATIMPU("Welcome Anirudh!");
] ALAITHE [
CHATIMPU("Access Denied!");
]
```

Example 4 — Loop with Sum
```
PADAM sum2:ANKHE = 0;

MALLI-MALLI (PADAM i:ANKHE = 1; i <= 5; i = i + 1) [
sum2 = sum2 + i;
]

CHATIMPU(sum2);
```
## 🛠 Error Handling Examples

- ```a = 1;``` → ❌ undeclared variable a.

- ```PADAM a:ANKHE = "hi";``` → ❌ type mismatch.

- ```MALLI-MALLI (PADAM i:VARTTAI = "x"; i < 5; i = i + 1) [ ]``` → ❌ loop variable must be ANKHE.

- ```ELAITHE (msg < 3) [ ]``` → ❌ non-integer in numeric comparison.

## ✅ Conclusion

This validator:

- Implements tokenizer + LL(1) parser.

- Performs syntax + semantic checks.

- Provides detailed line/column error reporting.

- Demonstrates assignment examples: Hello World, Sum, Conditional, Loop.