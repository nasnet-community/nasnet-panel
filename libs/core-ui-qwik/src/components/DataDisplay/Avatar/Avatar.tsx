import { component$ } from "@builder.io/qwik";

import { AvatarContent } from "./AvatarContent";
import { useAvatar } from "./hooks/useAvatar";

import type { AvatarProps } from "./Avatar.types";

/**
 * Avatar component for user representation
 */
export const Avatar = component$<AvatarProps>((props) => {
  const {
    class: className = "",
    id,
    alt = "Avatar",
    ariaLabel,
    href,
    target = "_self",
    clickable = false,
    loading = false,
    onClick$,
  } = props;

  // Use the custom hook
  const {
    imageLoaded,
    imageError,
    handleImageLoad$,
    handleImageError$,
    handleClick$,
    avatarClasses,
    statusClasses,
    statusPositionClasses,
    statusSize,
  } = useAvatar(props, onClick$);

  // Combined classes
  const classes = `${avatarClasses} ${className}`;

  // Content for all variants
  const avatarContent = (
    <AvatarContent
      props={props}
      imageLoaded={imageLoaded}
      imageError={imageError}
      handleImageLoad$={handleImageLoad$}
      handleImageError$={handleImageError$}
      statusClasses={statusClasses}
      statusPositionClasses={statusPositionClasses}
      statusSize={statusSize}
    />
  );

  // Render as link if href is provided
  if (href && !loading) {
    return (
      <a
        href={href}
        target={target}
        class={classes}
        id={id}
        aria-label={ariaLabel || alt}
      >
        {avatarContent}
      </a>
    );
  }

  // Render as button if clickable
  if (clickable && !loading) {
    return (
      <button
        type="button"
        class={classes}
        onClick$={handleClick$}
        id={id}
        disabled={loading}
        aria-label={ariaLabel || alt}
      >
        {avatarContent}
      </button>
    );
  }

  // Render as standard avatar
  return (
    <div class={classes} id={id} aria-label={ariaLabel || alt}>
      {avatarContent}
    </div>
  );
});
