import axios from "axios";

const BASE_URL = "http://localhost:4090"; // Change this if needed

export const startScoreUpdates = () => {
    const updateRandomEventScore = async () => {
        try {
            const { data: events } = await axios.get(`${BASE_URL}/events/all`);
            const ongoingEvents = events.filter(event => event.status !== "completed");

            if (ongoingEvents.length === 0) return;

            const randomEvent = ongoingEvents[Math.floor(Math.random() * ongoingEvents.length)];
            const { data } = await axios.get(`${BASE_URL}/api/events/update-scores?eventId=${randomEvent.eventId}`);

            console.log(`✅ Updated event ${randomEvent.eventId}:`, data);
        } catch (error) {
            console.error(`❌ Error updating scores: ${error.message}`);
        }
    };

    setInterval(updateRandomEventScore, 10 * 1000);
};
