(function () {
  // Prevent multiple initializations
  if (window.RagChatWidget) {
    console.log("RagChat Widget: Already initialized");
    return;
  }

  // Generate a random UUID for the author if not provided
  function generateUUID() {
    return (
      "visitor-" +
      "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      })
    );
  }

  // Widget configuration with defaults
  const config = window.RagChatConfig || {};
  const apiKey = config.apiKey;
  const author = config.author || generateUUID();
  const position = config.position || "bottom-right";
  const primaryColor = config.primaryColor || "#000000";
  const baseUrl = config.baseUrl || window.location.origin;

  if (!apiKey) {
    console.error("RagChat Widget: apiKey is required in RagChatConfig");
    return;
  }

  console.log("RagChat Widget: Initializing with config:", {
    apiKey: apiKey.substring(0, 8) + "...",
    author,
    position,
    primaryColor,
    baseUrl,
  });

  // Widget state
  let isOpen = false;
  let iframe = null;
  let chatButton = null;
  let container = null;

  const BotSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bot-message-square-icon lucide-bot-message-square" style="pointer-events: none;"><path d="M12 6V2H8"/><path d="m8 18-4 4V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2Z"/><path d="M2 12h2"/><path d="M9 11v2"/><path d="M15 11v2"/><path d="M20 12h2"/></svg>
  `;

  const XSVG = `
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-icon lucide-x" style="pointer-events: none;"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
  `;

  // Create widget button
  function createChatButton() {
    console.log("RagChat Widget: Creating chat button");
    chatButton = document.createElement("button");
    chatButton.innerHTML = BotSVG;

    const buttonStyles = {
      position: "fixed",
      bottom: "20px",
      right: position.includes("right") ? "20px" : "auto",
      left: position.includes("left") ? "20px" : "auto",
      width: "60px",
      height: "60px",
      borderRadius: "50%",
      backgroundColor: primaryColor,
      color: "white",
      border: "none",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
      zIndex: "2147483647",
      transition: "all 0.3s ease",
      fontSize: "0",
    };

    Object.assign(chatButton.style, buttonStyles);

    chatButton.addEventListener("mouseenter", function () {
      this.style.transform = "scale(1.1)";
      this.style.boxShadow = "0 6px 16px rgba(0, 0, 0, 0.2)";
    });

    chatButton.addEventListener("mouseleave", function () {
      this.style.transform = "scale(1)";
      this.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
    });

    // Use event delegation to handle clicks on button and all children
    chatButton.addEventListener("click", function (event) {
      console.log("RagChat Widget: Button clicked");
      event.preventDefault();
      event.stopPropagation();
      toggleChat();
    });

    document.body.appendChild(chatButton);
    console.log("RagChat Widget: Chat button added to DOM");
  }

  // Create iframe container (pre-create but keep hidden)
  function createIframe() {
    console.log("RagChat Widget: Creating iframe");
    container = document.createElement("div");
    const containerStyles = {
      position: "fixed",
      bottom: "90px",
      right: position.includes("right") ? "20px" : "auto",
      left: position.includes("left") ? "20px" : "auto",
      width: "400px",
      height: "600px",
      maxWidth: "calc(100vw - 40px)",
      maxHeight: "calc(100vh - 120px)",
      backgroundColor: "white",
      borderRadius: "12px",
      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
      zIndex: "2147483646",
      overflow: "hidden",
      transform: "translateY(20px) scale(0.95)",
      opacity: "0",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      pointerEvents: "none",
      visibility: "hidden", // Start completely hidden
    };

    Object.assign(container.style, containerStyles);

    iframe = document.createElement("iframe");
    const iframeUrl = `${baseUrl}/frame?apiKey=${encodeURIComponent(
      apiKey
    )}&author=${encodeURIComponent(author)}`;

    console.log("RagChat Widget: Loading iframe from:", iframeUrl);
    iframe.src = iframeUrl;
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "none";
    iframe.style.borderRadius = "12px";

    container.appendChild(iframe);
    document.body.appendChild(container);

    // Wait for iframe to load before allowing animations
    iframe.onload = function () {
      console.log("RagChat Widget: Iframe loaded, ready for animations");
      container.style.visibility = "visible";
    };
  }

  // Toggle chat visibility
  function toggleChat() {
    console.log("RagChat Widget: Toggling chat, current state:", isOpen);
    if (isOpen) {
      closeChat();
    } else {
      openChat();
    }
  }

  // Separate functions for cleaner animation handling
  function openChat() {
    // Ensure container is visible before animating
    if (container.style.visibility === "hidden") {
      setTimeout(() => openChat(), 50);
      return;
    }

    container.style.pointerEvents = "auto";
    container.style.opacity = "1";
    container.style.transform = "translateY(0) scale(1)";
    chatButton.innerHTML = XSVG;
    isOpen = true;
    console.log("RagChat Widget: Chat opened");
  }

  function closeChat() {
    container.style.opacity = "0";
    container.style.transform = "translateY(20px) scale(0.95)";
    container.style.pointerEvents = "none";
    chatButton.innerHTML = BotSVG;
    isOpen = false;
    console.log("RagChat Widget: Chat closed");
  }

  // Outside click handler removed - was causing conflicts with button clicks

  // Initialize widget
  function init() {
    console.log("RagChat Widget: Initializing widget");
    createChatButton();

    // Pre-create iframe container for smooth animations
    createIframe();

    // Handle escape key
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && isOpen) {
        console.log("RagChat Widget: Escape key pressed, closing chat");
        closeChat();
      }
    });

    // Handle responsive design
    function handleResize() {
      if (container && window.innerWidth < 480) {
        container.style.width = "calc(100vw - 40px)";
        container.style.height = "calc(100vh - 120px)";
        container.style.right = position.includes("right") ? "20px" : "auto";
        container.style.left = position.includes("left") ? "20px" : "auto";
      } else if (container) {
        container.style.width = "400px";
        container.style.height = "600px";
      }
    }

    window.addEventListener("resize", handleResize);
    handleResize();
    console.log("RagChat Widget: Widget initialization complete");
  }

  // Public API - Expose immediately to avoid timing issues
  window.RagChatWidget = {
    open: function () {
      console.log("RagChat Widget API: open() called");
      if (!isOpen) openChat();
    },
    close: function () {
      console.log("RagChat Widget API: close() called");
      if (isOpen) closeChat();
    },
    toggle: function () {
      console.log("RagChat Widget API: toggle() called");
      toggleChat();
    },
    isOpen: function () {
      console.log("RagChat Widget API: isOpen() called, returning:", isOpen);
      return isOpen;
    },
    destroy: function () {
      console.log("RagChat Widget API: destroy() called");
      if (chatButton) {
        document.body.removeChild(chatButton);
        chatButton = null;
      }
      if (container) {
        document.body.removeChild(container);
        container = null;
        iframe = null;
      }
      isOpen = false;
    },
  };

  console.log("RagChat Widget: API exposed to window.RagChatWidget");

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    console.log(
      "RagChat Widget: DOM still loading, waiting for DOMContentLoaded"
    );
    document.addEventListener("DOMContentLoaded", init);
  } else {
    console.log("RagChat Widget: DOM ready, initializing immediately");
    init();
  }
})();
