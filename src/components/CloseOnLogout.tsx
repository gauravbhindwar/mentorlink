"use client";
import { useEffect, useRef } from "react";
// import { useRouter } from "next/navigation";

export default function CloseOnLogout() {
    const socketRef = useRef<WebSocket | null>(null);
    // const router = useRouter();

    const handleLogout = async () => {
        try {
          // Call the logout API endpoint
          await fetch('/api/auth/logout', {
            method: 'POST',
          });
          
          // Clear client-side storage
          sessionStorage.clear();
          localStorage.clear();
          setTimeout(() => window.close(), 200);

          
          // Redirect to home page
        } catch (error) {
          console.error('Logout failed:', error);
          // Fallback to client-side logout
          sessionStorage.clear();
          localStorage.clear();
          setTimeout(() => window.close(), 200);

        }
      };

    useEffect(() => {
        // Only connect to WebSocket in production environment
        const env = process.env.NEXT_PUBLIC_ENV || process.env.ENV || 'production';
        
        if (env !== 'local') {
            console.log("🔗 Connecting to WebSocket server...");
            const connectWebSocket = () => {
                if (socketRef.current) {
                    socketRef.current.close(); // Close any existing connection before reconnecting
                }

                const socket = new WebSocket("wss://adminpanel.sdcmuj.com/ws");
                // const socket = new WebSocket("wss://uncovered-well-minute.glitch.me");
                socketRef.current = socket;

                socket.onopen = () => {
                    console.log("✅ Connected to WebSocket server");
                };

                socket.onmessage = (event) => {
                    console.log("📩 WebSocket Message Received:", event.data);
                    if (event.data === "logout") {
                        handleLogout();
                        console.log("🚀 Logout event received! Closing tab...");
                    }
                };

                

                socket.onclose = () => {
                    console.log("🔴 Disconnected from WebSocket server");
                };
            };

            connectWebSocket();
        } else {
            console.log("🏠 Local environment - WebSocket connection skipped");
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.close();
            }
        };
    }, []);

    return null;
}
