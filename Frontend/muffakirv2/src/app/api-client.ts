export const fetchHealth = async () => {
    const res = await fetch('/api/health');
    return res.json();
  };
  
  export const connectWebSocket = () => {
    return new WebSocket('ws://localhost:8000/ws');
  };