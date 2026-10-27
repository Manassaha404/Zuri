"use client";

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";
import {
  ZuriAvatar,
  type ZuriAvatarProps,
} from "@/components/ui/avatar-logo/ZuriAvatar";

type AvatarAnimation = NonNullable<ZuriAvatarProps["animation"]>;
type AvatarExpression = NonNullable<ZuriAvatarProps["expression"]>;

interface AuthAvatarContextValue {
  animation?: AvatarAnimation;
  expression?: AvatarExpression;
  isTyping: boolean;
  isPasswordFocused: boolean;
  isVerifying: boolean;
  hasError: boolean;
  isEffectiveError: boolean;
  setAnimation: (anim?: AvatarAnimation) => void;
  setExpression: (expr?: AvatarExpression) => void;
  setIsVerifying: (verifying: boolean) => void;
  setHasError: (error: boolean) => void;
  registerFieldError: (fieldId: string, hasError: boolean) => void;
  triggerTyping: (isPassword?: boolean) => void;
}

const AuthAvatarContext = createContext<AuthAvatarContextValue>({
  animation: undefined,
  expression: undefined,
  isTyping: false,
  isPasswordFocused: false,
  isVerifying: false,
  hasError: false,
  isEffectiveError: false,
  setAnimation: () => {},
  setExpression: () => {},
  setIsVerifying: () => {},
  setHasError: () => {},
  registerFieldError: () => {},
  triggerTyping: () => {},
});

export function useAuthAvatar() {
  return useContext(AuthAvatarContext);
}

interface AuthCardProps {
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  initialAnimation?: AvatarAnimation;
  isVerifying?: boolean;
  hasError?: boolean;
  error?: unknown;
}

export function AuthCard({
  children,
  footer,
  className = "",
  initialAnimation = "greet",
  isVerifying: isVerifyingProp = false,
  hasError: hasErrorProp = false,
  error: errorProp,
}: AuthCardProps) {
  const [internalVerifying, setInternalVerifying] = useState(false);
  const isVerifying = isVerifyingProp || internalVerifying;

  const [internalError, setInternalError] = useState(false);
  const fieldErrorsRef = useRef<Set<string>>(new Set());
  const [hasFieldErrors, setHasFieldErrors] = useState(false);

  const [errorDismissed, setErrorDismissed] = useState(false);
  const prevHasErrorRef = useRef(false);
  const prevVerifyingRef = useRef(false);
  const prevErrorPropRef = useRef(errorProp);

  const setHasError = useCallback((error: boolean) => {
    setInternalError(error);
    if (error) {
      setErrorDismissed(false);
    }
  }, []);

  const registerFieldError = useCallback((fieldId: string, hasErr: boolean) => {
    if (hasErr) {
      fieldErrorsRef.current.add(fieldId);
      setErrorDismissed(false);
    } else {
      fieldErrorsRef.current.delete(fieldId);
    }
    setHasFieldErrors(fieldErrorsRef.current.size > 0);
  }, []);

  const hasError = Boolean(
    hasErrorProp || errorProp || internalError || hasFieldErrors,
  );

  useEffect(() => {
    if (hasError && !prevHasErrorRef.current) {
      setErrorDismissed(false);
    }
    prevHasErrorRef.current = hasError;
  }, [hasError]);

  useEffect(() => {
    if (prevVerifyingRef.current && !isVerifying && hasError) {
      setErrorDismissed(false);
    }
    prevVerifyingRef.current = isVerifying;
  }, [isVerifying, hasError]);

  useEffect(() => {
    if (errorProp && errorProp !== prevErrorPropRef.current) {
      setErrorDismissed(false);
    }
    prevErrorPropRef.current = errorProp;
  }, [errorProp]);

  const [overrideAnimation, setOverrideAnimation] = useState<
    AvatarAnimation | undefined
  >(undefined);
  const [overrideExpression, setOverrideExpression] = useState<
    AvatarExpression | undefined
  >(undefined);

  const [isTyping, setIsTyping] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isFieldFocused, setIsFieldFocused] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearTypingTimer = () => {
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => clearTypingTimer();
  }, []);

  const triggerTyping = useCallback((isPassword = false) => {
    setHasInteracted(true);
    setIsTyping(true);
    setErrorDismissed(true); // User started typing again: normal animation resumes!
    setIsPasswordFocused(isPassword);
    setIsFieldFocused(true);

    clearTypingTimer();
    typingTimerRef.current = setTimeout(() => {
      setIsTyping(false);
      const active =
        typeof document !== "undefined" ? document.activeElement : null;
      if (active instanceof HTMLInputElement && active.type === "password") {
        setIsPasswordFocused(true);
        setIsFieldFocused(true);
      } else if (
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement
      ) {
        setIsPasswordFocused(false);
        setIsFieldFocused(true);
      } else {
        setIsPasswordFocused(false);
        setIsFieldFocused(false);
      }
    }, 1500);
  }, []);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement
    ) {
      const isPassword =
        target instanceof HTMLInputElement && target.type === "password";
      triggerTyping(isPassword);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (
      ["Shift", "Control", "Alt", "Meta", "Tab", "CapsLock"].includes(e.key)
    ) {
      return;
    }
    const target = e.target as HTMLElement;
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement
    ) {
      const isPassword =
        target instanceof HTMLInputElement && target.type === "password";
      triggerTyping(isPassword);
    }
  };

  const handleFocusCapture = (e: React.FocusEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement
    ) {
      setHasInteracted(true);
      const isPassword =
        target instanceof HTMLInputElement && target.type === "password";
      setIsFieldFocused(true);
      setIsPasswordFocused(isPassword);
    }
  };

  const handleBlurCapture = () => {
    setTimeout(() => {
      const active =
        typeof document !== "undefined" ? document.activeElement : null;
      if (
        !active ||
        !(
          active instanceof HTMLInputElement ||
          active instanceof HTMLTextAreaElement
        )
      ) {
        setIsPasswordFocused(false);
        setIsFieldFocused(false);
        setIsTyping(false);
      }
    }, 60);
  };

  // Error angry state is active when hasError is true AND user hasn't resumed typing:
  const isEffectiveError = hasError && !errorDismissed && !isTyping;

  // Determine active avatar animation and expression:
  let activeAnimation: AvatarAnimation | undefined = undefined;
  let activeExpression: AvatarExpression | undefined = undefined;

  if (overrideExpression) {
    activeExpression = overrideExpression;
    activeAnimation = undefined;
  } else if (overrideAnimation) {
    activeAnimation = overrideAnimation;
    activeExpression = undefined;
  } else if (isVerifying) {
    // In time of login password and OTP verification: angry-brows!
    activeExpression = "angry-brows";
    activeAnimation = undefined;
  } else if (isEffectiveError) {
    // For error: angry expression and avatar will shake!
    activeExpression = "angry-brows";
    activeAnimation = undefined;
  } else if (isPasswordFocused) {
    // When password field: looks upside slowly like a real bot looking away!
    activeAnimation = "looking-up";
    activeExpression = undefined;
  } else if (isTyping || isFieldFocused) {
    // When typing in any other field: avatar looks downside and expression changes slowly!
    activeAnimation = "typing-down";
    activeExpression = undefined;
  } else if (!hasInteracted) {
    activeAnimation = initialAnimation;
    activeExpression = undefined;
  } else {
    activeAnimation = "idle";
    activeExpression = undefined;
  }

  return (
    <AuthAvatarContext.Provider
      value={{
        animation: activeAnimation,
        expression: activeExpression,
        isTyping,
        isPasswordFocused,
        isVerifying,
        hasError,
        isEffectiveError,
        setAnimation: setOverrideAnimation,
        setExpression: setOverrideExpression,
        setIsVerifying: setInternalVerifying,
        setHasError,
        registerFieldError,
        triggerTyping,
      }}
    >
      <div
        className={`k ${className}`}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onFocusCapture={handleFocusCapture}
        onBlurCapture={handleBlurCapture}
        onSubmitCapture={() => setErrorDismissed(false)}
      >
        {children}
        {footer}
      </div>
    </AuthAvatarContext.Provider>
  );
}

interface AuthCardHeadingProps {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description: string;
  badge?: string;
  avatarSize?: number;
}

export function AuthCardHeading({
  icon,
  title,
  description,
  badge,
  avatarSize = 72,
}: AuthCardHeadingProps) {
  const { animation, expression, isEffectiveError } = useAuthAvatar();

  return (
    <div className="flex flex-col items-center text-center gap-2 mb-2">
      {icon ? (
        <div className="mb-1">{icon}</div>
      ) : (
        <div
          className={`relative mb-1 transition-transform duration-300 ease-out ${
            isEffectiveError ? "bot-shake" : ""
          }`}
        >
          <ZuriAvatar
            size={avatarSize}
            defaultAnimation="greet"
            animation={animation}
            expression={expression}
            ariaLabel="Zuri"
            className="shrink-0"
          />
        </div>
      )}
      {badge && (
        <span className="badge-pill mb-1 uppercase text-[10px] tracking-wider font-semibold">
          {badge}
        </span>
      )}
      <h1 className="text-xl sm:text-2xl font-semibold tracking-[-0.03em] text-[var(--i)] leading-tight">
        {title}
      </h1>
      <p className="text-xs sm:text-sm text-[var(--m)] leading-relaxed">
        {description}
      </p>
    </div>
  );
}
