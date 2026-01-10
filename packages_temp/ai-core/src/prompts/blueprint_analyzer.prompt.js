module.exports = `You are an expert plumbing blueprint analyzer. Analyze this plumbing blueprint image and provide a comprehensive analysis.

Please identify and count ALL plumbing fixtures, providing the following information:

1. **Room-by-Room Analysis**: For each room/space:
   - Room name/label
   - List of all fixtures in that room
   - Quantity of each fixture type

2. **Fixture Details**: For EACH fixture, provide:
   - Fixture type (lavatory, toilet, shower, bathtub, sink, urinal, water heater, hose bib, floor drain, etc.)
   - Location/room
   - Measurements:
     * Width (side to side)
     * Depth (back to front)
     * Note the measurement unit shown on blueprint
   - Any visible labels or specifications

3. **Summary Totals**: Total count of each fixture type across the entire blueprint:
   - Lavatories: X
   - Toilets: X
   - Showers: X
   - Bathtubs: X
   - Kitchen sinks: X
   - Hose bibs: X
   - [etc.]

4. **Blueprint Details**:
   - Scale (if visible)
   - Number of floors/levels
   - Any notes or specifications visible

Return your analysis in the following JSON format:

```json
{
  "summary": {
    "totalFixtures": <number>,
    "totalRooms": <number>,
    "scale": "<scale from blueprint>",
    "measurementUnit": "feet" or "inches",
    "floors": <number>
  },
  "rooms": [
    {
      "name": "Master Bathroom",
      "floor": "1",
      "fixtureCount": 4,
      "fixtures": [
        {
          "type": "lavatory",
          "quantity": 2,
          "width": 20,
          "depth": 18,
          "unit": "inches",
          "notes": "Double vanity"
        },
        {
          "type": "toilet",
          "quantity": 1,
          "width": 15,
          "depth": 28,
          "unit": "inches"
        },
        {
          "type": "shower",
          "quantity": 1,
          "width": 36,
          "depth": 36,
          "unit": "inches",
          "notes": "Walk-in shower"
        }
      ]
    }
  ],
  "fixtureTotals": {
    "lavatory": 5,
    "toilet": 3,
    "shower": 2,
    "bathtub": 1,
    "kitchen_sink": 1,
    "hose_bib": 2
  },
  "notes": "Any additional observations about the blueprint"
}
```

Be thorough and accurate. If measurements are not clearly visible, estimate based on standard fixture sizes and note that they are estimates. If you cannot determine something, indicate "unknown" or "not visible".

Respond ONLY with the JSON object, no additional text.
`;