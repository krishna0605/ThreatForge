import os

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.read().splitlines()
    
    # Fix W291 (trailing whitespace) and W293 (blank line contains whitespace)
    # by stripping whitespace from the right of each line
    fixed_lines = [line.rstrip() for line in lines]
    
    # Reassemble content
    content = '\n'.join(fixed_lines)
    
    # Fix W391 (blank line at end of file) and ensure single newline at end
    # strip() removes leading/trailing whitespace including newlines
    # then we add exactly one newline
    final_content = content.rstrip() + '\n'
    
    with open(filepath, 'w', encoding='utf-8', newline='\n') as f:
        f.write(final_content)
    print(f"Fixed {filepath}")

def main():
    root_dir = 'app'
    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if file.endswith('.py'):
                filepath = os.path.join(root, file)
                try:
                    fix_file(filepath)
                except Exception as e:
                    print(f"Error fixing {filepath}: {e}")

if __name__ == '__main__':
    main()
