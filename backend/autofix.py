"""
Safe flake8 autofix script.
Fixes ONLY: W291/W293 (trailing whitespace), W391 (blank line at EOF),
E302 (2 blank lines before top-level def/class), E303 (too many blank lines),
E261 (inline comment spacing).

Does NOT touch imports (F401) or indentation (E111/E117) to avoid breaking code.
"""
import os


def fix_e261(line):
    """Fix E261: at least two spaces before inline comment."""
    # Skip lines that are pure comments or empty
    stripped = line.lstrip()
    if not stripped or stripped.startswith('#'):
        return line

    # Find the first # not inside a string
    in_single = False
    in_double = False
    escaped = False
    for idx, ch in enumerate(line):
        if escaped:
            escaped = False
            continue
        if ch == '\\':
            escaped = True
            continue
        if ch == "'" and not in_double:
            in_single = not in_single
        elif ch == '"' and not in_single:
            in_double = not in_double
        elif ch == '#' and not in_single and not in_double and idx > 0:
            before = line[:idx]
            after = line[idx:]
            stripped_before = before.rstrip()
            if stripped_before:
                gap = len(before) - len(stripped_before)
                if gap < 2:
                    return stripped_before + '  ' + after
            break
    return line


def fix_file(filepath):
    """Process a single Python file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        original = f.read()

    lines = original.splitlines()

    # Step 1: Strip trailing whitespace (W291/W293)
    lines = [line.rstrip() for line in lines]

    # Step 2: Fix E261 (inline comment spacing)
    lines = [fix_e261(line) for line in lines]

    # Step 3: Fix E302 (2 blank lines before top-level def/class)
    # and E303 (too many blank lines)
    result = []
    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        is_toplevel = (stripped and
                       not line.startswith(' ') and
                       not line.startswith('\t'))

        # Detect start of a decorator chain or bare def/class at top level
        is_decorator_start = (is_toplevel and stripped.startswith('@'))
        is_def_or_class = (is_toplevel and
                           (stripped.startswith('def ') or
                            stripped.startswith('class ')))

        if is_decorator_start or is_def_or_class:
            # Check if we're continuing a decorator chain
            # Look back: if previous non-blank line was a decorator, don't add blanks
            prev_meaningful = None
            for j in range(len(result) - 1, -1, -1):
                if result[j].strip():
                    prev_meaningful = result[j].strip()
                    break

            continuing_chain = (prev_meaningful is not None and
                                prev_meaningful.startswith('@'))

            if continuing_chain:
                # Remove any blank lines between decorators / decorator and def
                while result and result[-1].strip() == '':
                    result.pop()
                result.append(line)
            else:
                # Need 2 blank lines before this (unless at file start)
                # Remove existing trailing blank lines
                while result and result[-1].strip() == '':
                    result.pop()
                # Add exactly 2 blank lines if there's content before
                if result:
                    result.append('')
                    result.append('')
                result.append(line)
        elif stripped == '':
            # Blank line - check we don't exceed 2 consecutive
            blank_count = 0
            for j in range(len(result) - 1, -1, -1):
                if result[j].strip() == '':
                    blank_count += 1
                else:
                    break
            if blank_count < 2:
                result.append(line)
            # else: skip (E303)
        else:
            result.append(line)

        i += 1

    # Step 4: Remove trailing blank lines (W391)
    while result and result[-1].strip() == '':
        result.pop()

    # Ensure exactly one trailing newline
    final = '\n'.join(result) + '\n'

    if final != original:
        with open(filepath, 'w', encoding='utf-8', newline='\n') as f:
            f.write(final)
        return True
    return False


def main():
    root = 'app'
    fixed = 0
    total = 0

    for dirpath, dirnames, filenames in os.walk(root):
        for filename in filenames:
            if filename.endswith('.py'):
                filepath = os.path.join(dirpath, filename).replace('\\', '/')
                total += 1
                if fix_file(filepath):
                    fixed += 1
                    print(f"  Fixed: {filepath}")

    print(f"\nProcessed {total} files, fixed {fixed}.")


if __name__ == '__main__':
    main()
