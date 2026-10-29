import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

export const getDestinations = async () => {
    try {
        const response = await axios.get(
            `${API_BASE_URL}/destinations`
        );

        return response.data.destinations;
    } catch (error) {
        console.error(
            "Error fetching destinations:",
            error.message
        );

        throw error;
    }
};