import "./style.css";

import { Renderer } from "./renderer";
import { ConfigUI } from "./config_ui";
import { ConfigManager } from "./config";

function display_error(title: string, error: Error | string, stack?: string) {
    const error_display = document.getElementById("error-display");
    if (!error_display) { return; }

    const error_message = typeof error === "string" ? error : error.message;

    error_display.innerHTML = `
        <h2>${title}</h2>
        <div class="error-message">${error_message}</div>
        ${stack ? `<div class="error-stack">${stack}</div>` : ""}
    `;
    error_display.style.display = "block";
}

function hide_error() {
    const error_display = document.getElementById("error-display");
    if (error_display) {
        error_display.style.display = "none";
    }
}

// Global error handler
window.addEventListener("error", (event) => {
    display_error(
        "Runtime Error",
        event.error || event.message,
        event.error?.stack
    );
});

// Global promise rejection handler
window.addEventListener("unhandledrejection", (event) => {
    display_error(
        "Unhandled Promise Rejection",
        event.reason,
        event.reason?.stack
    );
});

// Main initialization
async function init() {
    try {
        hide_error();

        const config_manager = new ConfigManager();
        const renderer = new Renderer(config_manager);

        await renderer.main();

        new ConfigUI(config_manager, renderer.get_event_bus());

        console.log("Application initialized successfully 😘");
    } catch (error) {
        display_error(
            "Initialization Failed",
            error instanceof Error ? error : String(error),
            error instanceof Error ? error.stack : undefined
        );
    }
}

init();
