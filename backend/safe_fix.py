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
    stripped = line.lstrip()
    if not stripped or stripped.startswith('#'):
        return line

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
    
    # 1. Strip trailing whitespace (W291, W293)
    lines = [line.rstrip() for line in lines]

    # 2. Fix E261
    lines = [fix_e261(line) for line in lines]

    # 3. Fix E302 / E303
    result = []
    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        is_toplevel = (stripped and not line.startswith((' ', '\t')))
        
        # Check for top-level def/class/decorator
        is_def_class = is_toplevel and stripped.startswith(('def ', 'class ', '@'))
        
        if is_def_class:
            # Check previous non-blank line to see if it's a decorator
            prev_meaningful = None
            for j in range(len(result)-1, -1, -1):
                if result[j].strip():
                    prev_meaningful = result[j].strip()
                    break
            
            is_continuation = prev_meaningful and prev_meaningful.startswith('@')
            
            if is_continuation:
                # No blank lines between decorators
                while result and not result[-1].strip():
                    result.pop()
                result.append(line)
            else:
                # Need 2 blank lines before start of chain/func
                # Unless it's the very first thing in the file (after imports/docstrings)
                # Simple heuristic: if we have seen code before, ensure 2 blanks.
                # If result is empty, we don't need blanks.
                if result:
                     # Remove trailing blanks
                    while result and not result[-1].strip():
                        result.pop()
                    # Add exactly 2 blanks
                    result.append('')
                    result.append('')
                result.append(line)
        elif not stripped:
            # Blank line
            # Don't add more than 1 consecutive blank line inside code
            # (unless required by E302 logic, which handles its own spacing)
            if result and not result[-1].strip():
                pass # Already have a blank line, skip (E303)
            else:
                result.append(line)
        else:
            result.append(line)
        i += 1
        
    # 4. Fix W391 (one newline at EOF)
    while result and not result[-1].strip():
        result.pop()
        
    final = '\n'.join(result) + '\n'
    
    if final != original:
        with open(filepath, 'w', encoding='utf-8', newline='\n') as f:
            f.write(final)
        print(f"Fixed: {filepath}")
        return True
    return False


def main():
    root = 'app'
    count = 0
    for dirpath, _, filenames in os.walk(root):
        for filename in filenames:
            if filename.endswith('.py'):
                if fix_file(os.path.join(dirpath, filename)):
                    count += 1
    print(f"Fixed {count} files.")

if __name__ == '__main__':
    main()
