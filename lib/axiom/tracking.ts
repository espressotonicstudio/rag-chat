"use client";

import { useLogger } from "./client";
import { useEffect, useCallback, useRef } from "react";

// Tracking event types
export const TRACKING_EVENTS = {
  SCROLL_DEPTH: "scroll_depth",
  BUTTON_CLICK: "button_click",
  FORM_SUBMIT: "form_submit",
  FORM_ABANDON: "form_abandon",
  FORM_START: "form_start",
  SUGGESTED_QUESTION_CLICK: "suggested_question_click",
} as const;

// Export types for better type safety
export type TrackingEvent =
  (typeof TRACKING_EVENTS)[keyof typeof TRACKING_EVENTS];

// Custom hook for scroll depth tracking
export function useScrollTracking() {
  const logger = useLogger();
  const trackedDepthsRef = useRef(new Set<number>());

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollTop =
            window.pageYOffset || document.documentElement.scrollTop;
          const windowHeight = window.innerHeight;
          const documentHeight = document.documentElement.scrollHeight;

          // Calculate scroll percentage
          const scrollPercent = Math.round(
            (scrollTop / (documentHeight - windowHeight)) * 100
          );

          // Track at 25%, 50%, 75%, and 100% thresholds
          const thresholds = [25, 50, 75, 100];

          thresholds.forEach((threshold) => {
            if (
              scrollPercent >= threshold &&
              !trackedDepthsRef.current.has(threshold)
            ) {
              trackedDepthsRef.current.add(threshold);
              logger.info(TRACKING_EVENTS.SCROLL_DEPTH, {
                depth_percent: threshold,
                scroll_top: scrollTop,
                document_height: documentHeight,
                window_height: windowHeight,
                timestamp: new Date().toISOString(),
                url: window.location.href,
                user_agent: navigator.userAgent,
              });
            }
          });

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [logger]);
}

// Custom hook for button click tracking
export function useButtonTracking() {
  const logger = useLogger();

  const trackButtonClick = useCallback(
    (buttonText: string, buttonType: string, location: string) => {
      logger.info(TRACKING_EVENTS.BUTTON_CLICK, {
        button_text: buttonText,
        button_type: buttonType,
        location: location,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        user_agent: navigator.userAgent,
      });
    },
    [logger]
  );

  return { trackButtonClick };
}

// Custom hook for form tracking
export function useFormTracking() {
  const logger = useLogger();
  const formStartedRef = useRef(false);
  const abandonmentTimerRef = useRef<NodeJS.Timeout | null>(null);

  const trackFormStart = useCallback(
    (formName: string, inputType: string) => {
      if (!formStartedRef.current) {
        formStartedRef.current = true;
        logger.info(TRACKING_EVENTS.FORM_START, {
          form_name: formName,
          input_type: inputType,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          user_agent: navigator.userAgent,
        });
      }
    },
    [logger]
  );

  const trackFormSubmit = useCallback(
    (formName: string, email: string) => {
      // Clear abandonment timer if form is submitted
      if (abandonmentTimerRef.current) {
        clearTimeout(abandonmentTimerRef.current);
        abandonmentTimerRef.current = null;
      }

      logger.info(TRACKING_EVENTS.FORM_SUBMIT, {
        form_name: formName,
        email_domain: email ? email.split("@")[1] : "unknown",
        timestamp: new Date().toISOString(),
        url: window.location.href,
        user_agent: navigator.userAgent,
      });
    },
    [logger]
  );

  const trackFormAbandon = useCallback(
    (formName: string, timeSpent: number) => {
      logger.info(TRACKING_EVENTS.FORM_ABANDON, {
        form_name: formName,
        time_spent_seconds: timeSpent,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        user_agent: navigator.userAgent,
      });
    },
    [logger]
  );

  // Set up abandonment tracking
  const setupAbandonmentTracking = useCallback(
    (formName: string) => {
      // Clear any existing timer
      if (abandonmentTimerRef.current) {
        clearTimeout(abandonmentTimerRef.current);
      }

      const startTime = Date.now();

      // Track abandonment if user hasn't submitted after 30 seconds of inactivity
      abandonmentTimerRef.current = setTimeout(() => {
        if (formStartedRef.current) {
          const timeSpent = Math.round((Date.now() - startTime) / 1000);
          trackFormAbandon(formName, timeSpent);
        }
      }, 30000);
    },
    [trackFormAbandon]
  );

  return {
    trackFormStart,
    trackFormSubmit,
    trackFormAbandon,
    setupAbandonmentTracking,
  };
}

// Custom hook for tracking suggested question clicks
export function useSuggestedQuestionTracking() {
  const logger = useLogger();

  const trackSuggestedQuestionClick = useCallback(
    (questionId: string, questionText: string, context: string = "unknown") => {
      logger.info(TRACKING_EVENTS.SUGGESTED_QUESTION_CLICK, {
        question_id: questionId,
        question_text: questionText,
        context: context,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        user_agent: navigator.userAgent,
      });
    },
    [logger]
  );

  return { trackSuggestedQuestionClick };
}

// Utility function to track custom events
export function useCustomTracking() {
  const logger = useLogger();

  const trackEvent = useCallback(
    (eventType: string, data: Record<string, any>) => {
      logger.info(eventType, {
        ...data,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        user_agent: navigator.userAgent,
      });
    },
    [logger]
  );

  return { trackEvent };
}
