export const predefinedScenarios = {
  "Hypothetical Child with Afflicted Cousin": {
    "condition": "cf",
    "individuals": [
      {"id": 1, "gender": "M", "race": "general", "is_sexual_partner_of": [2]},
      {"id": 2, "gender": "F", "race": "general", "is_sexual_partner_of": [1]},
      {"id": 3, "gender": "M", "parents": [1, 2], "is_sexual_partner_of": [5]},
      {"id": 4, "gender": "F", "parents": [1, 2], "is_sexual_partner_of": [7]},
      {"id": 5, "gender": "F", "race": "general", "is_sexual_partner_of": [3]},
      {"id": 6, "gender": "M", "parents": [3, 5], "affected": true},
      {"id": 7, "gender": "M", "race": "general", "is_sexual_partner_of": [4]},
      {"id": 8, "gender": "F", "parents": [4, 7], "hypothetical": true}
    ]
  },
  "Hypothetical Child with Afflicted Sibling": {
    "condition": "cf",
    "individuals": [
      {"id": 1, "gender": "M", "race": "general", "is_sexual_partner_of": [2], "x": 100, "y": 50},
      {"id": 2, "gender": "F", "race": "general", "is_sexual_partner_of": [1], "x": 200, "y": 50},
      {"id": 3, "gender": "M", "parents": [1, 2], "affected": true, "x": 150, "y": 150},
      {"id": 4, "gender": "F", "parents": [1, 2], "hypothetical": true, "x": 250, "y": 150}
    ]
  }
};
