import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';

export default function CustomCursor() {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  // Increased stiffness and decreased damping/mass for a much snappier, faster response
  const springConfig = { damping: 30, stiffness: 600, mass: 0.1 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  const [isClicking, setIsClicking] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Hide on touch devices
    if (window.matchMedia('(pointer: coarse)').matches) {
      return;
    }
    setIsVisible(true);

    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX - 16);
      cursorY.set(e.clientY - 16);
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Because we forced cursor: none globally, window.getComputedStyle(target).cursor will always be 'none'.
      // We must rely on tag names and roles to detect clickable elements.
      const isClickable = 
        target.tagName.toLowerCase() === 'button' || 
        target.tagName.toLowerCase() === 'a' ||
        target.tagName.toLowerCase() === 'input' ||
        target.tagName.toLowerCase() === 'select' ||
        target.closest('button') || 
        target.closest('a') ||
        target.getAttribute('role') === 'button';
        
      setIsHovering(!!isClickable);
    };

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, [cursorX, cursorY]);

  if (!isVisible) return null;

  return (
    <motion.div
      className="fixed top-0 left-0 w-8 h-8 rounded-full pointer-events-none z-[10000] flex items-center justify-center"
      style={{
        x: cursorXSpring,
        y: cursorYSpring,
        border: '2px solid rgba(90, 90, 64, 0.5)',
        backgroundColor: isHovering ? 'rgba(90, 90, 64, 0.1)' : 'transparent',
      }}
      animate={{
        scale: isClicking ? 0.7 : isHovering ? 1.5 : 1,
      }}
      transition={{ duration: 0.15 }}
    >
      <motion.div 
        className="w-1.5 h-1.5 bg-[#5A5A40] rounded-full"
        animate={{
          opacity: isHovering ? 0 : 1
        }}
      />
    </motion.div>
  );
}
