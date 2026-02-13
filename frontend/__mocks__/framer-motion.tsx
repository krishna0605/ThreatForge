import React, { forwardRef } from 'react';

const createMotionComponent = (Tag: string) => {
  // eslint-disable-next-line react/display-name
  return forwardRef(({ children, className, id, onClick, style, whileInView, viewport, initial, animate, exit, transition, whileHover, whileTap, ...props }: any, ref: any) => {
    return (
      <Tag ref={ref} className={className} id={id} onClick={onClick} style={style} {...props}>
        {children}
      </Tag>
    );
  });
};

export const motion = {
  div: createMotionComponent('div'),
  span: createMotionComponent('span'),
  section: createMotionComponent('section'),
  ul: createMotionComponent('ul'),
  li: createMotionComponent('li'),
  h1: createMotionComponent('h1'),
  h2: createMotionComponent('h2'),
  h3: createMotionComponent('h3'),
  p: createMotionComponent('p'),
  button: createMotionComponent('button'),
  a: createMotionComponent('a'),
  img: createMotionComponent('img'),
  form: createMotionComponent('form'),
};

export const AnimatePresence = ({ children }: any) => <>{children}</>;
