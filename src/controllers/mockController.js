const sports = ["Football", "Basketball", "Tennis", "Cricket"];
const teams = [
    ["TeamA", "TeamB"],
    ["TeamC", "TeamD"],
    ["TeamE", "TeamF"],
    ["TeamG", "TeamH"]
];

const getDynamicOdds = (team1, team2, score1, score2) => {
    const baseOdd = 1.2; // Minimum odds
    const maxOdd = 3.0;  // Maximum odds

    const diff = score1 - score2;

    const odds1 = (diff > 0 ? baseOdd + (maxOdd - baseOdd) * (1 / (diff + 2)) : 
                            maxOdd - (maxOdd - baseOdd) * (1 / (-diff + 2))).toFixed(2);
    const odds2 = (diff < 0 ? baseOdd + (maxOdd - baseOdd) * (1 / (-diff + 2)) : 
                            maxOdd - (maxOdd - baseOdd) * (1 / (diff + 2))).toFixed(2);

    return { [team1]: odds1, [team2]: odds2 };
};

const getRandomScore = (team1, team2) => ({
    [team1]: Math.floor(Math.random() * 5),
    [team2]: Math.floor(Math.random() * 5)
});

const getEventStatus = (commenceTime) => {
    const now = new Date();
    if (commenceTime > now) return "upcoming";
    if (commenceTime < now && Math.random() > 0.5) return "ongoing";
    return "completed";
};

export const getEvents = (req, res) => {
    const index = Math.floor(Math.random() * sports.length);
    const sport = sports[index];
    const [team1, team2] = teams[index];

    const commenceTime = new Date(Date.now() + Math.random() * 86400000); // Within next 24 hours
    const scores = getRandomScore(team1, team2);
    const odds = getDynamicOdds(team1, team2, scores[team1], scores[team2]);

    const event = {
        id: `event-${Math.floor(Math.random() * 10000)}`,
        sport_title: sport,
        commence_time: commenceTime.toISOString(),
        status: getEventStatus(commenceTime),
        bookmakers: [{ name: `Bookmaker${index + 1}`, odds }], // Only 1 bookmaker
        scores
    };

    res.json(event);
};
