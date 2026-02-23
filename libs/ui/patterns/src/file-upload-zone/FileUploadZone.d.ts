/**
 * File Upload Zone Component
 * Drag-and-drop file upload area matching Design Direction 1 (Clean Minimal)
 * Based on UX Design Specification - Component Library
 */
/**
 * FileUploadZone Props
 */
export interface FileUploadZoneProps {
    /** Accepted file extensions (e.g., ['.conf', '.json']) */
    accept?: string[];
    /** File selection callback */
    onFile: (file: File) => void;
    /** Loading state */
    isLoading?: boolean;
    /** Error message */
    error?: string;
    /** Maximum file size in bytes */
    maxSize?: number;
    /** Custom className */
    className?: string;
    /** Disabled state */
    disabled?: boolean;
}
/**
 * FileUploadZone Component
 * Provides drag-and-drop and click-to-browse file upload
 *
 * Features:
 * - Drag and drop support
 * - Click to browse
 * - File type validation
 * - Size validation
 * - Loading state
 * - Error state
 * - Highlight on drag over
 *
 * @example
 * ```tsx
 * <FileUploadZone
 *   accept={['.conf']}
 *   onFile={(file) => uploadConfig(file)}
 *   isLoading={uploading}
 * />
 * ```
 */
export declare function FileUploadZone({ accept, onFile, isLoading, error, maxSize, // 10MB default
className, disabled, }: FileUploadZoneProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=FileUploadZone.d.ts.map