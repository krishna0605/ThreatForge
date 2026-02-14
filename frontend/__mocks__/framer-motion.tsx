import React, { forwardRef } from 'react';

const createMockComponent = (tag: string) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Component = forwardRef(({ children, ...props }: React.ComponentProps<any>, ref: React.Ref<any>) => {
    // Filter out Framer Motion specific props to avoid React warnings
    const { 
      whileHover, whileTap, whileInView, initial, animate, exit, transition, variants, 
      ...validProps 
    } = props;
    // Prevent unused variable warnings
    void whileHover; void whileTap; void whileInView; void initial; void animate; void exit; void transition; void variants;
    return React.createElement(tag, { ref, ...validProps }, children);
  });
  Component.displayName = `Motion${tag.charAt(0).toUpperCase() + tag.slice(1)}`;
  return Component;
};

export const motion = {
  div: createMockComponent('div'),
  section: createMockComponent('section'),
  button: createMockComponent('button'),
  span: createMockComponent('span'),
  p: createMockComponent('p'),
  a: createMockComponent('a'),
  img: createMockComponent('img'),
  form: createMockComponent('form'),
  ul: createMockComponent('ul'),
  li: createMockComponent('li'),
  nav: createMockComponent('nav'),
  h1: createMockComponent('h1'),
  h2: createMockComponent('h2'),
  h3: createMockComponent('h3'),
  h4: createMockComponent('h4'),
  table: createMockComponent('table'),
  tr: createMockComponent('tr'),
  td: createMockComponent('td'),
  th: createMockComponent('th'),
  tbody: createMockComponent('tbody'),
  thead: createMockComponent('thead'),
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const AnimatePresence = ({ children }: any) => <>{children}</>;
