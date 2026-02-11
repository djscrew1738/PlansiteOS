// Keep relative by default so requests hit the same host/proxy.
const BASE_URL = import.meta.env.VITE_API_URL || '';

export default BASE_URL;
