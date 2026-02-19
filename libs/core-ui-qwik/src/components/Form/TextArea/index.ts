/**
 * TextArea Component
 *
 * TextArea provides a multi-line text input with features like auto-resize,
 * character counting, and validation states.
 */

import { useTextArea } from "./hooks/useTextArea";
import { TextArea } from "./TextArea";

import type {
  TextAreaProps,
  TextAreaSize,
  TextAreaResize,
  TextAreaState,
} from "./TextArea.types";

export {
  TextArea,
  useTextArea,

  // Types
  type TextAreaProps,
  type TextAreaSize,
  type TextAreaResize,
  type TextAreaState,
};
