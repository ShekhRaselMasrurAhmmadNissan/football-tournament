/**
 * Tournament data — a plain array of match objects, edited by the /admin portal.
 * No database, no JSON file: this module *is* the store. Every save rewrites the
 * `matches` / `teams` / `config` / `venues` declarations below.
 */
import type { Match, Team, TournamentConfig, Venue } from "@/lib/types";

export const TOURNAMENT_CONFIG: TournamentConfig = {
  "name": "Magura Golden Cup",
  "edition": "2026",
  "organiser": "Magura Golden Football Club",
  "kickoff": "2026-11-07T16:00:00+06:00",
  "finalDate": "2026-11-29T19:00:00+06:00",
  "prizePool": 1200000,
  "format": "16 teams · Single elimination"
};

export const VENUES: Venue[] = [
  {
    "id": "v1",
    "name": "Magura Stadium",
    "city": "Magura",
    "capacity": 24000,
    "surface": "Hybrid grass"
  },
  {
    "id": "v2",
    "name": "Shahid Stadium",
    "city": "Jashore",
    "capacity": 18500,
    "surface": "Natural grass"
  },
  {
    "id": "v3",
    "name": "North Field Ground",
    "city": "Faridpur",
    "capacity": 9200,
    "surface": "Natural grass"
  },
  {
    "id": "v4",
    "name": "Delta Park",
    "city": "Khulna",
    "capacity": 7800,
    "surface": "Artificial turf"
  }
];

export const TEAMS: Team[] = [
  {
    "id": "t1",
    "name": "Young Star Football Academy",
    "shortName": "YSFA",
    "city": "Narail",
    "manager": "Rakib Hasan",
    "founded": 1998,
    "primary": "#ef4444",
    "accent": "#fca5a5",
    "crest": "YSF",
    "squad": [
      {
        "id": "t1-p1",
        "name": "Arif Rahman",
        "position": "GK",
        "shirt": 1
      },
      {
        "id": "t1-p2",
        "name": "Sabbir Khan",
        "position": "DF",
        "shirt": 2
      },
      {
        "id": "t1-p3",
        "name": "Tanvir Ahmed",
        "position": "DF",
        "shirt": 3
      },
      {
        "id": "t1-p4",
        "name": "Mehedi Hasan",
        "position": "DF",
        "shirt": 4
      },
      {
        "id": "t1-p5",
        "name": "Rasel Mia",
        "position": "DF",
        "shirt": 5
      },
      {
        "id": "t1-p6",
        "name": "Nayeem Islam",
        "position": "MF",
        "shirt": 6
      },
      {
        "id": "t1-p7",
        "name": "Shakil Chowdhury",
        "position": "MF",
        "shirt": 7
      },
      {
        "id": "t1-p8",
        "name": "Fahim Reza",
        "position": "MF",
        "shirt": 8
      },
      {
        "id": "t1-p9",
        "name": "Jubayer Alam",
        "position": "FW",
        "shirt": 9
      },
      {
        "id": "t1-p10",
        "name": "Samin Yasar",
        "position": "FW",
        "shirt": 10
      },
      {
        "id": "t1-p11",
        "name": "Rifat Hossain",
        "position": "FW",
        "shirt": 11
      },
      {
        "id": "t1-p12",
        "name": "Imran Kabir",
        "position": "GK",
        "shirt": 12
      },
      {
        "id": "t1-p13",
        "name": "Sohel Rana",
        "position": "MF",
        "shirt": 13
      },
      {
        "id": "t1-p14",
        "name": "Arafat Sunny",
        "position": "FW",
        "shirt": 14
      }
    ]
  },
  {
    "id": "t2",
    "name": "Star Sun-moon Club",
    "shortName": "SSC",
    "city": "Rajghat",
    "manager": "Nazmul Islam",
    "founded": 2001,
    "primary": "#3b82f6",
    "accent": "#93c5fd",
    "crest": "SSC",
    "squad": [
      {
        "id": "t2-p1",
        "name": "Foysal Mahmud",
        "position": "GK",
        "shirt": 1
      },
      {
        "id": "t2-p2",
        "name": "Rony Das",
        "position": "DF",
        "shirt": 2
      },
      {
        "id": "t2-p3",
        "name": "Anik Barua",
        "position": "DF",
        "shirt": 3
      },
      {
        "id": "t2-p4",
        "name": "Sajid Hossain",
        "position": "DF",
        "shirt": 4
      },
      {
        "id": "t2-p5",
        "name": "Tuhin Roy",
        "position": "DF",
        "shirt": 5
      },
      {
        "id": "t2-p6",
        "name": "Mizanur Rahman",
        "position": "MF",
        "shirt": 6
      },
      {
        "id": "t2-p7",
        "name": "Ashraful Haque",
        "position": "MF",
        "shirt": 7
      },
      {
        "id": "t2-p8",
        "name": "Pias Ahmed",
        "position": "MF",
        "shirt": 8
      },
      {
        "id": "t2-p9",
        "name": "Sakib Al Hasan",
        "position": "FW",
        "shirt": 9
      },
      {
        "id": "t2-p10",
        "name": "Nabil Hasan",
        "position": "FW",
        "shirt": 10
      },
      {
        "id": "t2-p11",
        "name": "Zahid Hasan",
        "position": "FW",
        "shirt": 11
      },
      {
        "id": "t2-p12",
        "name": "Rubel Miah",
        "position": "GK",
        "shirt": 12
      },
      {
        "id": "t2-p13",
        "name": "Riyad Hossain",
        "position": "MF",
        "shirt": 13
      },
      {
        "id": "t2-p14",
        "name": "Tarek Aziz",
        "position": "FW",
        "shirt": 14
      }
    ]
  },
  {
    "id": "t3",
    "name": "Sylhet Strikers",
    "shortName": "SYS",
    "city": "Sylhet",
    "manager": "Habibur Rahman",
    "founded": 1995,
    "primary": "#22c55e",
    "accent": "#86efac",
    "crest": "SS",
    "squad": [
      {
        "id": "t3-p1",
        "name": "Mahin Chowdhury",
        "position": "GK",
        "shirt": 1
      },
      {
        "id": "t3-p2",
        "name": "Al Amin",
        "position": "DF",
        "shirt": 2
      },
      {
        "id": "t3-p3",
        "name": "Jashim Uddin",
        "position": "DF",
        "shirt": 3
      },
      {
        "id": "t3-p4",
        "name": "Rumman Ahmed",
        "position": "DF",
        "shirt": 4
      },
      {
        "id": "t3-p5",
        "name": "Rasel Ahmed",
        "position": "DF",
        "shirt": 5
      },
      {
        "id": "t3-p6",
        "name": "Shuvo Das",
        "position": "MF",
        "shirt": 6
      },
      {
        "id": "t3-p7",
        "name": "Nayan Miah",
        "position": "MF",
        "shirt": 7
      },
      {
        "id": "t3-p8",
        "name": "Rakib Hossain",
        "position": "MF",
        "shirt": 8
      },
      {
        "id": "t3-p9",
        "name": "Sifat Ullah",
        "position": "FW",
        "shirt": 9
      },
      {
        "id": "t3-p10",
        "name": "Rana Hossain",
        "position": "FW",
        "shirt": 10
      },
      {
        "id": "t3-p11",
        "name": "Emon Sarkar",
        "position": "FW",
        "shirt": 11
      },
      {
        "id": "t3-p12",
        "name": "Sajal Miah",
        "position": "GK",
        "shirt": 12
      },
      {
        "id": "t3-p13",
        "name": "Rashed Khan",
        "position": "MF",
        "shirt": 13
      },
      {
        "id": "t3-p14",
        "name": "Sohan Talukder",
        "position": "FW",
        "shirt": 14
      }
    ]
  },
  {
    "id": "t4",
    "name": "Khulna Kings",
    "shortName": "KHK",
    "city": "Khulna",
    "manager": "Shafiqul Alam",
    "founded": 1992,
    "primary": "#f59e0b",
    "accent": "#fcd34d",
    "crest": "KK",
    "squad": [
      {
        "id": "t4-p1",
        "name": "Mamun Hossain",
        "position": "GK",
        "shirt": 1
      },
      {
        "id": "t4-p2",
        "name": "Sohel Ahmed",
        "position": "DF",
        "shirt": 2
      },
      {
        "id": "t4-p3",
        "name": "Masud Rana",
        "position": "DF",
        "shirt": 3
      },
      {
        "id": "t4-p4",
        "name": "Shanto Roy",
        "position": "DF",
        "shirt": 4
      },
      {
        "id": "t4-p5",
        "name": "Nirob Das",
        "position": "DF",
        "shirt": 5
      },
      {
        "id": "t4-p6",
        "name": "Rasel Hossain",
        "position": "MF",
        "shirt": 6
      },
      {
        "id": "t4-p7",
        "name": "Anik Saha",
        "position": "MF",
        "shirt": 7
      },
      {
        "id": "t4-p8",
        "name": "Miraz Hossain",
        "position": "MF",
        "shirt": 8
      },
      {
        "id": "t4-p9",
        "name": "Bappy Sarder",
        "position": "FW",
        "shirt": 9
      },
      {
        "id": "t4-p10",
        "name": "Tamim Iqbal",
        "position": "FW",
        "shirt": 10
      },
      {
        "id": "t4-p11",
        "name": "Rony Hossain",
        "position": "FW",
        "shirt": 11
      },
      {
        "id": "t4-p12",
        "name": "Asif Mahmud",
        "position": "GK",
        "shirt": 12
      },
      {
        "id": "t4-p13",
        "name": "Rezaul Karim",
        "position": "MF",
        "shirt": 13
      },
      {
        "id": "t4-p14",
        "name": "Shuvo Roy",
        "position": "FW",
        "shirt": 14
      }
    ]
  },
  {
    "id": "t5",
    "name": "Rajshahi Rovers",
    "shortName": "RJR",
    "city": "Rajshahi",
    "manager": "Monirul Islam",
    "founded": 2004,
    "primary": "#a855f7",
    "accent": "#d8b4fe",
    "crest": "RR",
    "squad": [
      {
        "id": "t5-p1",
        "name": "Nahid Hasan",
        "position": "GK",
        "shirt": 1
      },
      {
        "id": "t5-p2",
        "name": "Imran Ali",
        "position": "DF",
        "shirt": 2
      },
      {
        "id": "t5-p3",
        "name": "Rakibul Islam",
        "position": "DF",
        "shirt": 3
      },
      {
        "id": "t5-p4",
        "name": "Sagor Hossain",
        "position": "DF",
        "shirt": 4
      },
      {
        "id": "t5-p5",
        "name": "Parvez Alam",
        "position": "DF",
        "shirt": 5
      },
      {
        "id": "t5-p6",
        "name": "Anisur Rahman",
        "position": "MF",
        "shirt": 6
      },
      {
        "id": "t5-p7",
        "name": "Sajjad Hossain",
        "position": "MF",
        "shirt": 7
      },
      {
        "id": "t5-p8",
        "name": "Joy Sarkar",
        "position": "MF",
        "shirt": 8
      },
      {
        "id": "t5-p9",
        "name": "Naeem Islam",
        "position": "FW",
        "shirt": 9
      },
      {
        "id": "t5-p10",
        "name": "Riad Hossain",
        "position": "FW",
        "shirt": 10
      },
      {
        "id": "t5-p11",
        "name": "Fardin Ahmed",
        "position": "FW",
        "shirt": 11
      },
      {
        "id": "t5-p12",
        "name": "Rakib Hasan",
        "position": "GK",
        "shirt": 12
      },
      {
        "id": "t5-p13",
        "name": "Mahmudul Hasan",
        "position": "MF",
        "shirt": 13
      },
      {
        "id": "t5-p14",
        "name": "Arman Hossain",
        "position": "FW",
        "shirt": 14
      }
    ]
  },
  {
    "id": "t6",
    "name": "Barishal Blasters",
    "shortName": "BRB",
    "city": "Barishal",
    "manager": "Kazi Nabil",
    "founded": 2007,
    "primary": "#06b6d4",
    "accent": "#67e8f9",
    "crest": "BB",
    "squad": [
      {
        "id": "t6-p1",
        "name": "Tofazzal Hossain",
        "position": "GK",
        "shirt": 1
      },
      {
        "id": "t6-p2",
        "name": "Rifat Mahmud",
        "position": "DF",
        "shirt": 2
      },
      {
        "id": "t6-p3",
        "name": "Nasir Uddin",
        "position": "DF",
        "shirt": 3
      },
      {
        "id": "t6-p4",
        "name": "Salman Hossain",
        "position": "DF",
        "shirt": 4
      },
      {
        "id": "t6-p5",
        "name": "Ashik Miah",
        "position": "DF",
        "shirt": 5
      },
      {
        "id": "t6-p6",
        "name": "Sujon Hossain",
        "position": "MF",
        "shirt": 6
      },
      {
        "id": "t6-p7",
        "name": "Rajib Das",
        "position": "MF",
        "shirt": 7
      },
      {
        "id": "t6-p8",
        "name": "Naim Sheikh",
        "position": "MF",
        "shirt": 8
      },
      {
        "id": "t6-p9",
        "name": "Miraj Sarkar",
        "position": "FW",
        "shirt": 9
      },
      {
        "id": "t6-p10",
        "name": "Sabbir Ahmed",
        "position": "FW",
        "shirt": 10
      },
      {
        "id": "t6-p11",
        "name": "Tanjim Hasan",
        "position": "FW",
        "shirt": 11
      },
      {
        "id": "t6-p12",
        "name": "Alauddin",
        "position": "GK",
        "shirt": 12
      },
      {
        "id": "t6-p13",
        "name": "Farhan Ahmed",
        "position": "MF",
        "shirt": 13
      },
      {
        "id": "t6-p14",
        "name": "Tuhin Das",
        "position": "FW",
        "shirt": 14
      }
    ]
  },
  {
    "id": "t7",
    "name": "Rangpur Rangers",
    "shortName": "RPR",
    "city": "Rangpur",
    "manager": "Ziaur Rahman",
    "founded": 2009,
    "primary": "#f43f5e",
    "accent": "#fda4af",
    "crest": "RG",
    "squad": [
      {
        "id": "t7-p1",
        "name": "Shariful Islam",
        "position": "GK",
        "shirt": 1
      },
      {
        "id": "t7-p2",
        "name": "Rashed Hossain",
        "position": "DF",
        "shirt": 2
      },
      {
        "id": "t7-p3",
        "name": "Rony Ahmed",
        "position": "DF",
        "shirt": 3
      },
      {
        "id": "t7-p4",
        "name": "Bipul Hossain",
        "position": "DF",
        "shirt": 4
      },
      {
        "id": "t7-p5",
        "name": "Nayan Das",
        "position": "DF",
        "shirt": 5
      },
      {
        "id": "t7-p6",
        "name": "Emon Hossain",
        "position": "MF",
        "shirt": 6
      },
      {
        "id": "t7-p7",
        "name": "Rakib Miah",
        "position": "MF",
        "shirt": 7
      },
      {
        "id": "t7-p8",
        "name": "Sajib Hossain",
        "position": "MF",
        "shirt": 8
      },
      {
        "id": "t7-p9",
        "name": "Omar Faruk",
        "position": "FW",
        "shirt": 9
      },
      {
        "id": "t7-p10",
        "name": "Samim Reza",
        "position": "FW",
        "shirt": 10
      },
      {
        "id": "t7-p11",
        "name": "Arif Hossain",
        "position": "FW",
        "shirt": 11
      },
      {
        "id": "t7-p12",
        "name": "Masum Billah",
        "position": "GK",
        "shirt": 12
      },
      {
        "id": "t7-p13",
        "name": "Rifat Hossain",
        "position": "MF",
        "shirt": 13
      },
      {
        "id": "t7-p14",
        "name": "Shakil Ahmed",
        "position": "FW",
        "shirt": 14
      }
    ]
  },
  {
    "id": "t8",
    "name": "Ejaj Football Academy",
    "shortName": "EFA",
    "city": "Khulna",
    "manager": "Delwar Hossain",
    "founded": 2011,
    "primary": "#eab308",
    "accent": "#fde047",
    "crest": "EFA",
    "squad": [
      {
        "id": "t8-p1",
        "name": "Habib Ullah",
        "position": "GK",
        "shirt": 1
      },
      {
        "id": "t8-p2",
        "name": "Kawsar Ahmed",
        "position": "DF",
        "shirt": 2
      },
      {
        "id": "t8-p3",
        "name": "Robiul Islam",
        "position": "DF",
        "shirt": 3
      },
      {
        "id": "t8-p4",
        "name": "Shahin Alam",
        "position": "DF",
        "shirt": 4
      },
      {
        "id": "t8-p5",
        "name": "Manik Hossain",
        "position": "DF",
        "shirt": 5
      },
      {
        "id": "t8-p6",
        "name": "Mamun Sarkar",
        "position": "MF",
        "shirt": 6
      },
      {
        "id": "t8-p7",
        "name": "Emon Ahmed",
        "position": "MF",
        "shirt": 7
      },
      {
        "id": "t8-p8",
        "name": "Siam Hossain",
        "position": "MF",
        "shirt": 8
      },
      {
        "id": "t8-p9",
        "name": "Rasel Mahmud",
        "position": "FW",
        "shirt": 9
      },
      {
        "id": "t8-p10",
        "name": "Tamzid Hasan",
        "position": "FW",
        "shirt": 10
      },
      {
        "id": "t8-p11",
        "name": "Rifat Chowdhury",
        "position": "FW",
        "shirt": 11
      },
      {
        "id": "t8-p12",
        "name": "Nabin Das",
        "position": "GK",
        "shirt": 12
      },
      {
        "id": "t8-p13",
        "name": "Shanto Miah",
        "position": "MF",
        "shirt": 13
      },
      {
        "id": "t8-p14",
        "name": "Sifat Hossain",
        "position": "FW",
        "shirt": 14
      }
    ]
  },
  {
    "id": "t9",
    "name": "Dhopadi Footbal 11",
    "shortName": "DF11",
    "city": "Dhopadi",
    "manager": "Jahirul Haque",
    "founded": 2003,
    "primary": "#8b5cf6",
    "accent": "#c4b5fd",
    "crest": "DF",
    "squad": [
      {
        "id": "t9-p1",
        "name": "Rakibul Hasan",
        "position": "GK",
        "shirt": 1
      },
      {
        "id": "t9-p2",
        "name": "Sohel Rana",
        "position": "DF",
        "shirt": 2
      },
      {
        "id": "t9-p3",
        "name": "Naeem Hasan",
        "position": "DF",
        "shirt": 3
      },
      {
        "id": "t9-p4",
        "name": "Tanvir Islam",
        "position": "DF",
        "shirt": 4
      },
      {
        "id": "t9-p5",
        "name": "Jashim Miah",
        "position": "DF",
        "shirt": 5
      },
      {
        "id": "t9-p6",
        "name": "Riyad Ahmed",
        "position": "MF",
        "shirt": 6
      },
      {
        "id": "t9-p7",
        "name": "Sumon Hossain",
        "position": "MF",
        "shirt": 7
      },
      {
        "id": "t9-p8",
        "name": "Rony Mia",
        "position": "MF",
        "shirt": 8
      },
      {
        "id": "t9-p9",
        "name": "Shakib Hossain",
        "position": "FW",
        "shirt": 9
      },
      {
        "id": "t9-p10",
        "name": "Nayeem Ahmed",
        "position": "FW",
        "shirt": 10
      },
      {
        "id": "t9-p11",
        "name": "Rakib Hossain",
        "position": "FW",
        "shirt": 11
      },
      {
        "id": "t9-p12",
        "name": "Sifat Ahmed",
        "position": "GK",
        "shirt": 12
      },
      {
        "id": "t9-p13",
        "name": "Rasel Miah",
        "position": "MF",
        "shirt": 13
      },
      {
        "id": "t9-p14",
        "name": "Anik Hossain",
        "position": "FW",
        "shirt": 14
      }
    ]
  },
  {
    "id": "t10",
    "name": "Narayanganj United",
    "shortName": "NRU",
    "city": "Narayanganj",
    "manager": "Selim Reza",
    "founded": 1999,
    "primary": "#14b8a6",
    "accent": "#5eead4",
    "crest": "NU",
    "squad": [
      {
        "id": "t10-p1",
        "name": "Kamrul Islam",
        "position": "GK",
        "shirt": 1
      },
      {
        "id": "t10-p2",
        "name": "Rasel Hossain",
        "position": "DF",
        "shirt": 2
      },
      {
        "id": "t10-p3",
        "name": "Mahmud Alam",
        "position": "DF",
        "shirt": 3
      },
      {
        "id": "t10-p4",
        "name": "Sujon Ahmed",
        "position": "DF",
        "shirt": 4
      },
      {
        "id": "t10-p5",
        "name": "Rana Miah",
        "position": "DF",
        "shirt": 5
      },
      {
        "id": "t10-p6",
        "name": "Naim Hossain",
        "position": "MF",
        "shirt": 6
      },
      {
        "id": "t10-p7",
        "name": "Sabbir Rahman",
        "position": "MF",
        "shirt": 7
      },
      {
        "id": "t10-p8",
        "name": "Miraz Ahmed",
        "position": "MF",
        "shirt": 8
      },
      {
        "id": "t10-p9",
        "name": "Jahid Hossain",
        "position": "FW",
        "shirt": 9
      },
      {
        "id": "t10-p10",
        "name": "Rifat Mia",
        "position": "FW",
        "shirt": 10
      },
      {
        "id": "t10-p11",
        "name": "Shuvo Hossain",
        "position": "FW",
        "shirt": 11
      },
      {
        "id": "t10-p12",
        "name": "Rony Ahmed",
        "position": "GK",
        "shirt": 12
      },
      {
        "id": "t10-p13",
        "name": "Sakib Das",
        "position": "MF",
        "shirt": 13
      },
      {
        "id": "t10-p14",
        "name": "Emon Miah",
        "position": "FW",
        "shirt": 14
      }
    ]
  },
  {
    "id": "t11",
    "name": "Bogura Bulls",
    "shortName": "BGB",
    "city": "Bogura",
    "manager": "Mostafiz Rahman",
    "founded": 2006,
    "primary": "#f97316",
    "accent": "#fdba74",
    "crest": "BG",
    "squad": [
      {
        "id": "t11-p1",
        "name": "Sohag Ali",
        "position": "GK",
        "shirt": 1
      },
      {
        "id": "t11-p2",
        "name": "Rashed Miah",
        "position": "DF",
        "shirt": 2
      },
      {
        "id": "t11-p3",
        "name": "Anwar Hossain",
        "position": "DF",
        "shirt": 3
      },
      {
        "id": "t11-p4",
        "name": "Sajid Alam",
        "position": "DF",
        "shirt": 4
      },
      {
        "id": "t11-p5",
        "name": "Rifat Das",
        "position": "DF",
        "shirt": 5
      },
      {
        "id": "t11-p6",
        "name": "Nazmul Hossain",
        "position": "MF",
        "shirt": 6
      },
      {
        "id": "t11-p7",
        "name": "Rasel Ahmed",
        "position": "MF",
        "shirt": 7
      },
      {
        "id": "t11-p8",
        "name": "Sohan Hossain",
        "position": "MF",
        "shirt": 8
      },
      {
        "id": "t11-p9",
        "name": "Tarek Hossain",
        "position": "FW",
        "shirt": 9
      },
      {
        "id": "t11-p10",
        "name": "Rony Das",
        "position": "FW",
        "shirt": 10
      },
      {
        "id": "t11-p11",
        "name": "Sabbir Hossain",
        "position": "FW",
        "shirt": 11
      },
      {
        "id": "t11-p12",
        "name": "Tuhin Miah",
        "position": "GK",
        "shirt": 12
      },
      {
        "id": "t11-p13",
        "name": "Anik Das",
        "position": "MF",
        "shirt": 13
      },
      {
        "id": "t11-p14",
        "name": "Sajib Miah",
        "position": "FW",
        "shirt": 14
      }
    ]
  },
  {
    "id": "t12",
    "name": "Gazipur Gladiators",
    "shortName": "GZG",
    "city": "Gazipur",
    "manager": "Ashiqur Rahman",
    "founded": 2013,
    "primary": "#64748b",
    "accent": "#cbd5e1",
    "crest": "GG",
    "squad": [
      {
        "id": "t12-p1",
        "name": "Shahidul Islam",
        "position": "GK",
        "shirt": 1
      },
      {
        "id": "t12-p2",
        "name": "Rakib Alam",
        "position": "DF",
        "shirt": 2
      },
      {
        "id": "t12-p3",
        "name": "Rony Hossain",
        "position": "DF",
        "shirt": 3
      },
      {
        "id": "t12-p4",
        "name": "Masud Miah",
        "position": "DF",
        "shirt": 4
      },
      {
        "id": "t12-p5",
        "name": "Nayeem Das",
        "position": "DF",
        "shirt": 5
      },
      {
        "id": "t12-p6",
        "name": "Sajid Hossain",
        "position": "MF",
        "shirt": 6
      },
      {
        "id": "t12-p7",
        "name": "Rakib Ahmed",
        "position": "MF",
        "shirt": 7
      },
      {
        "id": "t12-p8",
        "name": "Tuhin Hossain",
        "position": "MF",
        "shirt": 8
      },
      {
        "id": "t12-p9",
        "name": "Rifat Ahmed",
        "position": "FW",
        "shirt": 9
      },
      {
        "id": "t12-p10",
        "name": "Nabin Hossain",
        "position": "FW",
        "shirt": 10
      },
      {
        "id": "t12-p11",
        "name": "Sagor Miah",
        "position": "FW",
        "shirt": 11
      },
      {
        "id": "t12-p12",
        "name": "Al Amin",
        "position": "GK",
        "shirt": 12
      },
      {
        "id": "t12-p13",
        "name": "Mizan Hossain",
        "position": "MF",
        "shirt": 13
      },
      {
        "id": "t12-p14",
        "name": "Jubayer Ahmed",
        "position": "FW",
        "shirt": 14
      }
    ]
  },
  {
    "id": "t13",
    "name": "Tangail Tigers",
    "shortName": "TGT",
    "city": "Tangail",
    "manager": "Anwar Hossain",
    "founded": 2000,
    "primary": "#e11d48",
    "accent": "#fda4af",
    "crest": "TT",
    "squad": [
      {
        "id": "t13-p1",
        "name": "Rasel Mia",
        "position": "GK",
        "shirt": 1
      },
      {
        "id": "t13-p2",
        "name": "Shanto Hossain",
        "position": "DF",
        "shirt": 2
      },
      {
        "id": "t13-p3",
        "name": "Arif Hossain",
        "position": "DF",
        "shirt": 3
      },
      {
        "id": "t13-p4",
        "name": "Emon Das",
        "position": "DF",
        "shirt": 4
      },
      {
        "id": "t13-p5",
        "name": "Sabbir Miah",
        "position": "DF",
        "shirt": 5
      },
      {
        "id": "t13-p6",
        "name": "Rakib Hossain",
        "position": "MF",
        "shirt": 6
      },
      {
        "id": "t13-p7",
        "name": "Sohan Ahmed",
        "position": "MF",
        "shirt": 7
      },
      {
        "id": "t13-p8",
        "name": "Nayeem Islam",
        "position": "MF",
        "shirt": 8
      },
      {
        "id": "t13-p9",
        "name": "Tamim Hossain",
        "position": "FW",
        "shirt": 9
      },
      {
        "id": "t13-p10",
        "name": "Rifat Hossain",
        "position": "FW",
        "shirt": 10
      },
      {
        "id": "t13-p11",
        "name": "Shakil Mia",
        "position": "FW",
        "shirt": 11
      },
      {
        "id": "t13-p12",
        "name": "Mamun Hossain",
        "position": "GK",
        "shirt": 12
      },
      {
        "id": "t13-p13",
        "name": "Sifat Miah",
        "position": "MF",
        "shirt": 13
      },
      {
        "id": "t13-p14",
        "name": "Rony Hossain",
        "position": "FW",
        "shirt": 14
      }
    ]
  },
  {
    "id": "t14",
    "name": "Cox's Bazar Waves",
    "shortName": "CBW",
    "city": "Cox's Bazar",
    "manager": "Tanvir Alam",
    "founded": 2015,
    "primary": "#0284c7",
    "accent": "#7dd3fc",
    "crest": "CB",
    "squad": [
      {
        "id": "t14-p1",
        "name": "Mizanur Rahman",
        "position": "GK",
        "shirt": 1
      },
      {
        "id": "t14-p2",
        "name": "Sohel Miah",
        "position": "DF",
        "shirt": 2
      },
      {
        "id": "t14-p3",
        "name": "Rifat Alam",
        "position": "DF",
        "shirt": 3
      },
      {
        "id": "t14-p4",
        "name": "Anik Hossain",
        "position": "DF",
        "shirt": 4
      },
      {
        "id": "t14-p5",
        "name": "Nayeem Mia",
        "position": "DF",
        "shirt": 5
      },
      {
        "id": "t14-p6",
        "name": "Tarek Hossain",
        "position": "MF",
        "shirt": 6
      },
      {
        "id": "t14-p7",
        "name": "Rony Miah",
        "position": "MF",
        "shirt": 7
      },
      {
        "id": "t14-p8",
        "name": "Sajid Hossain",
        "position": "MF",
        "shirt": 8
      },
      {
        "id": "t14-p9",
        "name": "Nabil Hossain",
        "position": "FW",
        "shirt": 9
      },
      {
        "id": "t14-p10",
        "name": "Rakib Mia",
        "position": "FW",
        "shirt": 10
      },
      {
        "id": "t14-p11",
        "name": "Shanto Das",
        "position": "FW",
        "shirt": 11
      },
      {
        "id": "t14-p12",
        "name": "Rasel Hossain",
        "position": "GK",
        "shirt": 12
      },
      {
        "id": "t14-p13",
        "name": "Emon Miah",
        "position": "MF",
        "shirt": 13
      },
      {
        "id": "t14-p14",
        "name": "Tuhin Hossain",
        "position": "FW",
        "shirt": 14
      }
    ]
  },
  {
    "id": "t15",
    "name": "Faridpur Falcons",
    "shortName": "FPF",
    "city": "Faridpur",
    "manager": "Sharif Ahmed",
    "founded": 2008,
    "primary": "#7c3aed",
    "accent": "#ddd6fe",
    "crest": "FF",
    "squad": [
      {
        "id": "t15-p1",
        "name": "Jashim Hossain",
        "position": "GK",
        "shirt": 1
      },
      {
        "id": "t15-p2",
        "name": "Rakib Das",
        "position": "DF",
        "shirt": 2
      },
      {
        "id": "t15-p3",
        "name": "Shakil Hossain",
        "position": "DF",
        "shirt": 3
      },
      {
        "id": "t15-p4",
        "name": "Arif Mia",
        "position": "DF",
        "shirt": 4
      },
      {
        "id": "t15-p5",
        "name": "Sujon Hossain",
        "position": "DF",
        "shirt": 5
      },
      {
        "id": "t15-p6",
        "name": "Naim Miah",
        "position": "MF",
        "shirt": 6
      },
      {
        "id": "t15-p7",
        "name": "Rifat Hossain",
        "position": "MF",
        "shirt": 7
      },
      {
        "id": "t15-p8",
        "name": "Sabbir Alam",
        "position": "MF",
        "shirt": 8
      },
      {
        "id": "t15-p9",
        "name": "Sifat Hossain",
        "position": "FW",
        "shirt": 9
      },
      {
        "id": "t15-p10",
        "name": "Rony Miah",
        "position": "FW",
        "shirt": 10
      },
      {
        "id": "t15-p11",
        "name": "Tuhin Ahmed",
        "position": "FW",
        "shirt": 11
      },
      {
        "id": "t15-p12",
        "name": "Nayeem Das",
        "position": "GK",
        "shirt": 12
      },
      {
        "id": "t15-p13",
        "name": "Miraz Hossain",
        "position": "MF",
        "shirt": 13
      },
      {
        "id": "t15-p14",
        "name": "Anik Miah",
        "position": "FW",
        "shirt": 14
      }
    ]
  },
  {
    "id": "t16",
    "name": "Star Sun-moon Club",
    "shortName": "SSC",
    "city": "Rajghat",
    "manager": "Imrul Kayes",
    "founded": 2017,
    "primary": "#84cc16",
    "accent": "#bef264",
    "crest": "SSC",
    "squad": [
      {
        "id": "t16-p1",
        "name": "Rony Hossain",
        "position": "GK",
        "shirt": 1
      },
      {
        "id": "t16-p2",
        "name": "Anik Alam",
        "position": "DF",
        "shirt": 2
      },
      {
        "id": "t16-p3",
        "name": "Tuhin Miah",
        "position": "DF",
        "shirt": 3
      },
      {
        "id": "t16-p4",
        "name": "Rakib Hossain",
        "position": "DF",
        "shirt": 4
      },
      {
        "id": "t16-p5",
        "name": "Sajid Das",
        "position": "DF",
        "shirt": 5
      },
      {
        "id": "t16-p6",
        "name": "Rifat Miah",
        "position": "MF",
        "shirt": 6
      },
      {
        "id": "t16-p7",
        "name": "Sabbir Hossain",
        "position": "MF",
        "shirt": 7
      },
      {
        "id": "t16-p8",
        "name": "Naim Ahmed",
        "position": "MF",
        "shirt": 8
      },
      {
        "id": "t16-p9",
        "name": "Emon Hossain",
        "position": "FW",
        "shirt": 9
      },
      {
        "id": "t16-p10",
        "name": "Shanto Miah",
        "position": "FW",
        "shirt": 10
      },
      {
        "id": "t16-p11",
        "name": "Nabin Ahmed",
        "position": "FW",
        "shirt": 11
      },
      {
        "id": "t16-p12",
        "name": "Arif Hossain",
        "position": "GK",
        "shirt": 12
      },
      {
        "id": "t16-p13",
        "name": "Sifat Miah",
        "position": "MF",
        "shirt": 13
      },
      {
        "id": "t16-p14",
        "name": "Rasel Ahmed",
        "position": "FW",
        "shirt": 14
      }
    ]
  }
];

export const MATCHES: Match[] = [
  {
    "id": "r16-1",
    "stage": "r16",
    "slot": 1,
    "homeId": "t1",
    "awayId": "t16",
    "homeScore": 2,
    "awayScore": 0,
    "homePens": null,
    "awayPens": null,
    "status": "finished",
    "kickoff": "2026-10-25T09:00:00.000Z",
    "venue": "Magura Stadium",
    "minute": 0,
    "goals": [],
    "cards": [],
    "homeFrom": null,
    "awayFrom": null
  },
  {
    "id": "r16-2",
    "stage": "r16",
    "slot": 2,
    "homeId": "t8",
    "awayId": "t9",
    "homeScore": null,
    "awayScore": null,
    "homePens": null,
    "awayPens": null,
    "status": "scheduled",
    "kickoff": "2026-10-29T09:00:00.000Z",
    "venue": "Magura Stadium",
    "minute": 0,
    "goals": [],
    "cards": [],
    "homeFrom": null,
    "awayFrom": null
  },
  {
    "id": "r16-3",
    "stage": "r16",
    "slot": 3,
    "homeId": "t5",
    "awayId": "t12",
    "homeScore": null,
    "awayScore": null,
    "homePens": null,
    "awayPens": null,
    "status": "scheduled",
    "kickoff": "2026-11-08T10:00:00.000Z",
    "venue": "Magura Stadium",
    "minute": 0,
    "goals": [],
    "cards": [],
    "homeFrom": null,
    "awayFrom": null
  },
  {
    "id": "r16-4",
    "stage": "r16",
    "slot": 4,
    "homeId": "t4",
    "awayId": "t13",
    "homeScore": null,
    "awayScore": null,
    "homePens": null,
    "awayPens": null,
    "status": "scheduled",
    "kickoff": "2026-11-08T13:00:00.000Z",
    "venue": "Magura Stadium",
    "minute": 0,
    "goals": [],
    "cards": [],
    "homeFrom": null,
    "awayFrom": null
  },
  {
    "id": "r16-5",
    "stage": "r16",
    "slot": 5,
    "homeId": "t3",
    "awayId": "t14",
    "homeScore": null,
    "awayScore": null,
    "homePens": null,
    "awayPens": null,
    "status": "scheduled",
    "kickoff": "2026-11-09T10:00:00.000Z",
    "venue": "Magura Stadium",
    "minute": 0,
    "goals": [],
    "cards": [],
    "homeFrom": null,
    "awayFrom": null
  },
  {
    "id": "r16-6",
    "stage": "r16",
    "slot": 6,
    "homeId": "t6",
    "awayId": "t11",
    "homeScore": null,
    "awayScore": null,
    "homePens": null,
    "awayPens": null,
    "status": "scheduled",
    "kickoff": "2026-11-09T13:00:00.000Z",
    "venue": "Magura Stadium",
    "minute": 0,
    "goals": [],
    "cards": [],
    "homeFrom": null,
    "awayFrom": null
  },
  {
    "id": "r16-7",
    "stage": "r16",
    "slot": 7,
    "homeId": "t7",
    "awayId": "t10",
    "homeScore": null,
    "awayScore": null,
    "homePens": null,
    "awayPens": null,
    "status": "scheduled",
    "kickoff": "2026-11-10T10:00:00.000Z",
    "venue": "Magura Stadium",
    "minute": 0,
    "goals": [],
    "cards": [],
    "homeFrom": null,
    "awayFrom": null
  },
  {
    "id": "r16-8",
    "stage": "r16",
    "slot": 8,
    "homeId": "t2",
    "awayId": "t15",
    "homeScore": null,
    "awayScore": null,
    "homePens": null,
    "awayPens": null,
    "status": "scheduled",
    "kickoff": "2026-11-10T13:00:00.000Z",
    "venue": "Magura Stadium",
    "minute": 0,
    "goals": [],
    "cards": [],
    "homeFrom": null,
    "awayFrom": null
  },
  {
    "id": "qf-1",
    "stage": "qf",
    "slot": 1,
    "homeId": "t1",
    "awayId": null,
    "homeScore": null,
    "awayScore": null,
    "homePens": null,
    "awayPens": null,
    "status": "scheduled",
    "kickoff": "2026-11-16T12:00:00.000Z",
    "venue": "Magura Stadium",
    "minute": 0,
    "goals": [],
    "cards": [],
    "homeFrom": "r16-1",
    "awayFrom": "r16-2"
  },
  {
    "id": "qf-2",
    "stage": "qf",
    "slot": 2,
    "homeId": null,
    "awayId": null,
    "homeScore": null,
    "awayScore": null,
    "homePens": null,
    "awayPens": null,
    "status": "scheduled",
    "kickoff": "2026-11-17T12:00:00.000Z",
    "venue": "Magura Stadium",
    "minute": 0,
    "goals": [],
    "cards": [],
    "homeFrom": "r16-3",
    "awayFrom": "r16-4"
  },
  {
    "id": "qf-3",
    "stage": "qf",
    "slot": 3,
    "homeId": null,
    "awayId": null,
    "homeScore": null,
    "awayScore": null,
    "homePens": null,
    "awayPens": null,
    "status": "scheduled",
    "kickoff": "2026-11-18T12:00:00.000Z",
    "venue": "Magura Stadium",
    "minute": 0,
    "goals": [],
    "cards": [],
    "homeFrom": "r16-5",
    "awayFrom": "r16-6"
  },
  {
    "id": "qf-4",
    "stage": "qf",
    "slot": 4,
    "homeId": null,
    "awayId": null,
    "homeScore": null,
    "awayScore": null,
    "homePens": null,
    "awayPens": null,
    "status": "scheduled",
    "kickoff": "2026-11-19T12:00:00.000Z",
    "venue": "Magura Stadium",
    "minute": 0,
    "goals": [],
    "cards": [],
    "homeFrom": "r16-7",
    "awayFrom": "r16-8"
  },
  {
    "id": "sf-1",
    "stage": "sf",
    "slot": 1,
    "homeId": null,
    "awayId": null,
    "homeScore": null,
    "awayScore": null,
    "homePens": null,
    "awayPens": null,
    "status": "scheduled",
    "kickoff": "2026-11-16T12:00:00.000Z",
    "venue": "Magura Stadium",
    "minute": 0,
    "goals": [],
    "cards": [],
    "homeFrom": "qf-1",
    "awayFrom": "qf-2"
  },
  {
    "id": "sf-2",
    "stage": "sf",
    "slot": 2,
    "homeId": null,
    "awayId": null,
    "homeScore": null,
    "awayScore": null,
    "homePens": null,
    "awayPens": null,
    "status": "scheduled",
    "kickoff": "2026-11-17T12:00:00.000Z",
    "venue": "Magura Stadium",
    "minute": 0,
    "goals": [],
    "cards": [],
    "homeFrom": "qf-3",
    "awayFrom": "qf-4"
  },
  {
    "id": "final-1",
    "stage": "final",
    "slot": 1,
    "homeId": null,
    "awayId": null,
    "homeScore": null,
    "awayScore": null,
    "homePens": null,
    "awayPens": null,
    "status": "scheduled",
    "kickoff": "2026-11-16T12:00:00.000Z",
    "venue": "Magura Stadium",
    "minute": 0,
    "goals": [],
    "cards": [],
    "homeFrom": "sf-1",
    "awayFrom": "sf-2"
  }
];
