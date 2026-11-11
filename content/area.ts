// Service area: everywhere within 30 miles of Jamison. Sam widened it from Addendum A1's 10 miles on
// 2026-11-11. `areaZips` drives the "Do we come to you?" check, the town and county lists, the booking
// form's out-of-area note and firewood delivery.
//
// It lists every ZIP whose Census 2020 ZIP-area center (ZCTA internal point) is within
// `serviceRadius.miles` of the center below: 305 of them, 203 in Pennsylvania and 102 in New Jersey.
// Built 2026-11-11:
// - the ZIP areas and their centers come from the Census TIGERweb ZCTA layer;
// - each county is the TIGERweb county containing that center;
// - post-office names come from GeoNames, via the Zippopotam API;
// - the 33 ZIPs inside 10 miles keep their hand-checked names and other names.
// Just outside, and so not listed: 08833 (30.0), 08026 (30.0), 08829 (30.0), 08068 (30.1), 19094 (30.1), 18018 (30.3), 19345 (30.4), 08066 (30.5), 18103 (30.5), 08641 (30.5), 08055 (30.6), 08876 (30.8), 19022 (30.9), 08869 (31.1), 08097 (31.1), 08865 (31.2), 18062 (31.3), 18020 (31.3), 18101 (31.3).
// Those still get "ask us" rather than "no".

export type AreaState = "PA" | "NJ";

export interface AreaZip {
  zip: string;
  /** Post-office name */
  name: string;
  /** Other names people use for places in this ZIP */
  aka?: string[];
  state: AreaState;
  /** County the ZIP area's center is in, without the word "County" */
  county: string;
  /** Miles from the center of the circle to the middle of the ZIP area */
  miles: number;
}

export const areaZips: AreaZip[] = [
  { zip: "18929", name: "Jamison", aka: ["Warwick"], state: "PA", county: "Bucks", miles: 0.1 },
  { zip: "18925", name: "Furlong", state: "PA", county: "Bucks", miles: 1.9 },
  { zip: "18974", name: "Warminster", aka: ["Ivyland", "Hartsville"], state: "PA", county: "Bucks", miles: 3.0 },
  { zip: "18976", name: "Warrington", state: "PA", county: "Bucks", miles: 3.4 },
  { zip: "18980", name: "Wycombe", state: "PA", county: "Bucks", miles: 3.7 },
  { zip: "18912", name: "Buckingham", state: "PA", county: "Bucks", miles: 3.9 },
  { zip: "18946", name: "Pineville", state: "PA", county: "Bucks", miles: 4.3 },
  { zip: "18901", name: "Doylestown", aka: ["New Britain"], state: "PA", county: "Bucks", miles: 4.8 },
  { zip: "18954", name: "Richboro", state: "PA", county: "Bucks", miles: 5.2 },
  { zip: "19040", name: "Hatboro", state: "PA", county: "Montgomery", miles: 5.9 },
  { zip: "18966", name: "Southampton", aka: ["Holland", "Churchville", "Upper Southampton", "Northampton"], state: "PA", county: "Bucks", miles: 6.2 },
  { zip: "19044", name: "Horsham", state: "PA", county: "Montgomery", miles: 6.2 },
  { zip: "18902", name: "Doylestown", state: "PA", county: "Bucks", miles: 6.5 },
  { zip: "18914", name: "Chalfont", state: "PA", county: "Bucks", miles: 7.2 },
  { zip: "18940", name: "Newtown", state: "PA", county: "Bucks", miles: 7.5 },
  { zip: "18938", name: "New Hope", state: "PA", county: "Bucks", miles: 7.6 },
  { zip: "18913", name: "Carversville", state: "PA", county: "Bucks", miles: 7.9 },
  { zip: "18923", name: "Fountainville", state: "PA", county: "Bucks", miles: 7.9 },
  { zip: "19090", name: "Willow Grove", state: "PA", county: "Montgomery", miles: 8.1 },
  { zip: "18936", name: "Montgomeryville", state: "PA", county: "Montgomery", miles: 8.1 },
  { zip: "19009", name: "Bryn Athyn", state: "PA", county: "Montgomery", miles: 8.5 },
  { zip: "19002", name: "Ambler", aka: ["Maple Glen"], state: "PA", county: "Montgomery", miles: 8.7 },
  { zip: "19454", name: "North Wales", state: "PA", county: "Montgomery", miles: 9.0 },
  { zip: "19025", name: "Dresher", state: "PA", county: "Montgomery", miles: 9.0 },
  { zip: "19006", name: "Huntingdon Valley", state: "PA", county: "Montgomery", miles: 9.1 },
  { zip: "19053", name: "Feasterville-Trevose", aka: ["Feasterville", "Trevose", "Lower Southampton"], state: "PA", county: "Bucks", miles: 9.2 },
  { zip: "18932", name: "Line Lexington", state: "PA", county: "Bucks", miles: 9.2 },
  { zip: "18915", name: "Colmar", state: "PA", county: "Montgomery", miles: 9.3 },
  { zip: "19001", name: "Abington", state: "PA", county: "Montgomery", miles: 9.6 },
  { zip: "18927", name: "Hilltown", state: "PA", county: "Bucks", miles: 9.6 },
  { zip: "19477", name: "Spring House", state: "PA", county: "Montgomery", miles: 9.7 },
  { zip: "19436", name: "Gwynedd", state: "PA", county: "Montgomery", miles: 9.8 },
  { zip: "18917", name: "Dublin", state: "PA", county: "Bucks", miles: 9.8 },
  { zip: "18933", name: "Lumberville", state: "PA", county: "Bucks", miles: 10.1 },
  { zip: "19047", name: "Langhorne", state: "PA", county: "Bucks", miles: 10.4 },
  { zip: "19116", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 10.4 },
  { zip: "18977", name: "Washington Crossing", state: "PA", county: "Bucks", miles: 11.0 },
  { zip: "19437", name: "Gwynedd Valley", state: "PA", county: "Montgomery", miles: 11.0 },
  { zip: "19046", name: "Jenkintown", state: "PA", county: "Montgomery", miles: 11.0 },
  { zip: "19034", name: "Fort Washington", state: "PA", county: "Montgomery", miles: 11.1 },
  { zip: "19440", name: "Hatfield", state: "PA", county: "Montgomery", miles: 11.3 },
  { zip: "18947", name: "Pipersville", state: "PA", county: "Bucks", miles: 11.4 },
  { zip: "19075", name: "Oreland", state: "PA", county: "Montgomery", miles: 11.6 },
  { zip: "18962", name: "Silverdale", state: "PA", county: "Bucks", miles: 11.6 },
  { zip: "19038", name: "Glenside", state: "PA", county: "Montgomery", miles: 11.7 },
  { zip: "08530", name: "Lambertville", state: "NJ", county: "Hunterdon", miles: 11.7 },
  { zip: "19067", name: "Yardley", aka: ["Morrisville", "Lower Makefield"], state: "PA", county: "Bucks", miles: 11.8 },
  { zip: "19115", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 11.9 },
  { zip: "19446", name: "Lansdale", state: "PA", county: "Montgomery", miles: 12.0 },
  { zip: "18944", name: "Perkasie", state: "PA", county: "Bucks", miles: 12.3 },
  { zip: "08560", name: "Titusville", state: "NJ", county: "Mercer", miles: 12.4 },
  { zip: "19154", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 12.5 },
  { zip: "19095", name: "Wyncote", state: "PA", county: "Montgomery", miles: 12.6 },
  { zip: "19422", name: "Blue Bell", state: "PA", county: "Montgomery", miles: 12.7 },
  { zip: "19031", name: "Flourtown", state: "PA", county: "Montgomery", miles: 12.8 },
  { zip: "19056", name: "Levittown", state: "PA", county: "Bucks", miles: 12.8 },
  { zip: "19027", name: "Elkins Park", state: "PA", county: "Montgomery", miles: 13.1 },
  { zip: "08628", name: "Trenton", state: "NJ", county: "Mercer", miles: 13.3 },
  { zip: "08559", name: "Stockton", state: "NJ", county: "Hunterdon", miles: 13.4 },
  { zip: "19020", name: "Bensalem", state: "PA", county: "Bucks", miles: 13.4 },
  { zip: "19111", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 13.8 },
  { zip: "19152", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 13.8 },
  { zip: "19114", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 13.8 },
  { zip: "19150", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 13.8 },
  { zip: "19012", name: "Cheltenham", state: "PA", county: "Montgomery", miles: 13.9 },
  { zip: "18964", name: "Souderton", state: "PA", county: "Montgomery", miles: 13.9 },
  { zip: "19030", name: "Fairless Hills", state: "PA", county: "Bucks", miles: 14.0 },
  { zip: "18950", name: "Point Pleasant", state: "PA", county: "Bucks", miles: 14.2 },
  { zip: "19057", name: "Levittown", state: "PA", county: "Bucks", miles: 14.3 },
  { zip: "19126", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 14.4 },
  { zip: "19118", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 14.6 },
  { zip: "19462", name: "Plymouth Meeting", state: "PA", county: "Montgomery", miles: 14.6 },
  { zip: "19138", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 14.7 },
  { zip: "19055", name: "Levittown", state: "PA", county: "Bucks", miles: 14.8 },
  { zip: "18960", name: "Sellersville", state: "PA", county: "Bucks", miles: 14.9 },
  { zip: "19444", name: "Lafayette Hill", state: "PA", county: "Montgomery", miles: 15.1 },
  { zip: "19490", name: "Worcester", state: "PA", county: "Montgomery", miles: 15.1 },
  { zip: "19054", name: "Levittown", state: "PA", county: "Bucks", miles: 15.2 },
  { zip: "08618", name: "Trenton", state: "NJ", county: "Mercer", miles: 15.3 },
  { zip: "19021", name: "Croydon", state: "PA", county: "Bucks", miles: 15.4 },
  { zip: "19149", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 15.4 },
  { zip: "19119", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 15.5 },
  { zip: "18942", name: "Ottsville", state: "PA", county: "Bucks", miles: 15.5 },
  { zip: "19007", name: "Bristol", state: "PA", county: "Bucks", miles: 15.5 },
  { zip: "19136", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 15.5 },
  { zip: "19141", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 15.7 },
  { zip: "19120", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 15.7 },
  { zip: "18969", name: "Telford", state: "PA", county: "Montgomery", miles: 15.9 },
  { zip: "08534", name: "Pennington", state: "NJ", county: "Mercer", miles: 15.9 },
  { zip: "19401", name: "Norristown", state: "PA", county: "Montgomery", miles: 16.0 },
  { zip: "18920", name: "Erwinna", state: "PA", county: "Bucks", miles: 16.1 },
  { zip: "19438", name: "Harleysville", state: "PA", county: "Montgomery", miles: 16.4 },
  { zip: "19135", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 16.5 },
  { zip: "19144", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 16.6 },
  { zip: "19128", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 16.6 },
  { zip: "08010", name: "Beverly", state: "NJ", county: "Burlington", miles: 16.6 },
  { zip: "08638", name: "Trenton", state: "NJ", county: "Mercer", miles: 16.7 },
  { zip: "08608", name: "Trenton", state: "NJ", county: "Mercer", miles: 16.8 },
  { zip: "19124", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 16.8 },
  { zip: "19428", name: "Conshohocken", state: "PA", county: "Montgomery", miles: 17.1 },
  { zip: "19474", name: "Skippack", state: "PA", county: "Montgomery", miles: 17.3 },
  { zip: "08075", name: "Riverside", state: "NJ", county: "Burlington", miles: 17.4 },
  { zip: "19405", name: "Bridgeport", state: "PA", county: "Montgomery", miles: 17.4 },
  { zip: "19140", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 17.5 },
  { zip: "19403", name: "Norristown", state: "PA", county: "Montgomery", miles: 17.6 },
  { zip: "08518", name: "Florence", state: "NJ", county: "Burlington", miles: 17.7 },
  { zip: "19127", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 17.7 },
  { zip: "08825", name: "Frenchtown", state: "NJ", county: "Hunterdon", miles: 17.8 },
  { zip: "19035", name: "Gladwyne", state: "PA", county: "Montgomery", miles: 17.8 },
  { zip: "08065", name: "Palmyra", state: "NJ", county: "Burlington", miles: 17.9 },
  { zip: "19129", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 18.0 },
  { zip: "08609", name: "Trenton", state: "NJ", county: "Mercer", miles: 18.0 },
  { zip: "08551", name: "Ringoes", state: "NJ", county: "Hunterdon", miles: 18.2 },
  { zip: "19137", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 18.5 },
  { zip: "08525", name: "Hopewell", state: "NJ", county: "Mercer", miles: 18.5 },
  { zip: "08077", name: "Riverton", state: "NJ", county: "Burlington", miles: 18.6 },
  { zip: "08629", name: "Trenton", state: "NJ", county: "Mercer", miles: 18.6 },
  { zip: "18972", name: "Upper Black Eddy", state: "PA", county: "Bucks", miles: 18.6 },
  { zip: "08611", name: "Trenton", state: "NJ", county: "Mercer", miles: 18.7 },
  { zip: "19133", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 18.7 },
  { zip: "08554", name: "Roebling", state: "NJ", county: "Burlington", miles: 18.8 },
  { zip: "19134", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 18.8 },
  { zip: "08016", name: "Burlington", state: "NJ", county: "Burlington", miles: 18.8 },
  { zip: "19132", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 18.8 },
  { zip: "19072", name: "Narberth", state: "PA", county: "Montgomery", miles: 18.8 },
  { zip: "08046", name: "Willingboro", state: "NJ", county: "Burlington", miles: 19.0 },
  { zip: "18970", name: "Trumbauersville", state: "PA", county: "Bucks", miles: 19.0 },
  { zip: "19004", name: "Bala Cynwyd", state: "PA", county: "Montgomery", miles: 19.1 },
  { zip: "08648", name: "Trenton", state: "NJ", county: "Mercer", miles: 19.2 },
  { zip: "18921", name: "Ferndale", state: "PA", county: "Bucks", miles: 19.2 },
  { zip: "19426", name: "Collegeville", state: "PA", county: "Montgomery", miles: 19.5 },
  { zip: "18955", name: "Richlandtown", state: "PA", county: "Bucks", miles: 19.6 },
  { zip: "18951", name: "Quakertown", state: "PA", county: "Bucks", miles: 19.7 },
  { zip: "19125", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 19.7 },
  { zip: "08610", name: "Trenton", state: "NJ", county: "Mercer", miles: 19.7 },
  { zip: "19406", name: "King of Prussia", state: "PA", county: "Montgomery", miles: 19.8 },
  { zip: "19122", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 19.8 },
  { zip: "19121", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 19.9 },
  { zip: "19066", name: "Merion Station", state: "PA", county: "Montgomery", miles: 19.9 },
  { zip: "08110", name: "Pennsauken", state: "NJ", county: "Camden", miles: 19.9 },
  { zip: "18054", name: "Green Lane", state: "PA", county: "Montgomery", miles: 20.0 },
  { zip: "18930", name: "Kintnersville", state: "PA", county: "Bucks", miles: 20.1 },
  { zip: "19131", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 20.3 },
  { zip: "08619", name: "Trenton", state: "NJ", county: "Mercer", miles: 20.3 },
  { zip: "18935", name: "Milford Square", state: "PA", county: "Bucks", miles: 20.4 },
  { zip: "08073", name: "Rancocas", state: "NJ", county: "Burlington", miles: 20.6 },
  { zip: "08057", name: "Moorestown", state: "NJ", county: "Burlington", miles: 20.7 },
  { zip: "19123", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 20.8 },
  { zip: "19096", name: "Wynnewood", state: "PA", county: "Montgomery", miles: 20.8 },
  { zip: "19130", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 20.8 },
  { zip: "19085", name: "Villanova", state: "PA", county: "Delaware", miles: 21.0 },
  { zip: "19010", name: "Bryn Mawr", state: "PA", county: "Delaware", miles: 21.0 },
  { zip: "19108", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 21.2 },
  { zip: "19473", name: "Schwenksville", state: "PA", county: "Montgomery", miles: 21.2 },
  { zip: "19003", name: "Ardmore", state: "PA", county: "Delaware", miles: 21.2 },
  { zip: "08822", name: "Flemington", state: "NJ", county: "Hunterdon", miles: 21.3 },
  { zip: "08102", name: "Camden", state: "NJ", county: "Camden", miles: 21.4 },
  { zip: "08105", name: "Camden", state: "NJ", county: "Camden", miles: 21.4 },
  { zip: "08505", name: "Bordentown", state: "NJ", county: "Burlington", miles: 21.5 },
  { zip: "19151", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 21.5 },
  { zip: "08109", name: "Merchantville", state: "NJ", county: "Camden", miles: 21.5 },
  { zip: "19102", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 21.7 },
  { zip: "19107", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 21.7 },
  { zip: "08052", name: "Maple Shade", state: "NJ", county: "Burlington", miles: 21.7 },
  { zip: "19041", name: "Haverford", state: "PA", county: "Delaware", miles: 21.7 },
  { zip: "19087", name: "Wayne", state: "PA", county: "Chester", miles: 21.8 },
  { zip: "19104", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 21.8 },
  { zip: "19103", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 21.8 },
  { zip: "19456", name: "Oaks", state: "PA", county: "Montgomery", miles: 21.8 },
  { zip: "19492", name: "Zieglerville", state: "PA", county: "Montgomery", miles: 21.9 },
  { zip: "19109", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 21.9 },
  { zip: "19106", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 21.9 },
  { zip: "19139", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 22.1 },
  { zip: "08690", name: "Trenton", state: "NJ", county: "Mercer", miles: 22.3 },
  { zip: "08558", name: "Skillman", state: "NJ", county: "Somerset", miles: 22.5 },
  { zip: "08103", name: "Camden", state: "NJ", county: "Camden", miles: 22.5 },
  { zip: "08867", name: "Pittstown", state: "NJ", county: "Hunterdon", miles: 22.5 },
  { zip: "18073", name: "Pennsburg", state: "PA", county: "Montgomery", miles: 22.5 },
  { zip: "18076", name: "Red Hill", state: "PA", county: "Montgomery", miles: 22.6 },
  { zip: "08002", name: "Cherry Hill", state: "NJ", county: "Camden", miles: 22.7 },
  { zip: "19147", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 22.7 },
  { zip: "19146", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 22.8 },
  { zip: "18077", name: "Riegelsville", state: "PA", county: "Bucks", miles: 23.0 },
  { zip: "08060", name: "Mount Holly", state: "NJ", county: "Burlington", miles: 23.0 },
  { zip: "19082", name: "Upper Darby", state: "PA", county: "Delaware", miles: 23.0 },
  { zip: "08544", name: "Princeton", state: "NJ", county: "Mercer", miles: 23.0 },
  { zip: "08542", name: "Princeton", state: "NJ", county: "Mercer", miles: 23.0 },
  { zip: "19083", name: "Havertown", state: "PA", county: "Delaware", miles: 23.1 },
  { zip: "08848", name: "Milford", state: "NJ", county: "Hunterdon", miles: 23.1 },
  { zip: "19143", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 23.2 },
  { zip: "18074", name: "Perkiomenville", state: "PA", county: "Montgomery", miles: 23.3 },
  { zip: "08036", name: "Hainesport", state: "NJ", county: "Burlington", miles: 23.4 },
  { zip: "08887", name: "Three Bridges", state: "NJ", county: "Hunterdon", miles: 23.5 },
  { zip: "08620", name: "Trenton", state: "NJ", county: "Mercer", miles: 23.5 },
  { zip: "08540", name: "Princeton", state: "NJ", county: "Mercer", miles: 23.5 },
  { zip: "08054", name: "Mount Laurel", state: "NJ", county: "Burlington", miles: 23.5 },
  { zip: "18081", name: "Springtown", state: "PA", county: "Bucks", miles: 23.5 },
  { zip: "19333", name: "Devon", state: "PA", county: "Chester", miles: 23.6 },
  { zip: "18036", name: "Coopersburg", state: "PA", county: "Lehigh", miles: 23.7 },
  { zip: "08104", name: "Camden", state: "NJ", county: "Camden", miles: 23.8 },
  { zip: "19453", name: "Mont Clare", state: "PA", county: "Montgomery", miles: 23.8 },
  { zip: "08022", name: "Columbus", state: "NJ", county: "Burlington", miles: 23.8 },
  { zip: "08108", name: "Collingswood", state: "NJ", county: "Camden", miles: 23.9 },
  { zip: "08515", name: "Crosswicks", state: "NJ", county: "Burlington", miles: 24.1 },
  { zip: "08550", name: "Princeton Junction", state: "NJ", county: "Mercer", miles: 24.2 },
  { zip: "19468", name: "Royersford", state: "PA", county: "Montgomery", miles: 24.2 },
  { zip: "19050", name: "Lansdowne", state: "PA", county: "Delaware", miles: 24.3 },
  { zip: "19148", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 24.4 },
  { zip: "08107", name: "Oaklyn", state: "NJ", county: "Camden", miles: 24.4 },
  { zip: "19026", name: "Drexel Hill", state: "PA", county: "Delaware", miles: 24.5 },
  { zip: "19145", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 24.6 },
  { zip: "19008", name: "Broomall", state: "PA", county: "Delaware", miles: 24.7 },
  { zip: "19142", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 24.7 },
  { zip: "08034", name: "Cherry Hill", state: "NJ", county: "Camden", miles: 24.8 },
  { zip: "19312", name: "Berwyn", state: "PA", county: "Chester", miles: 25.1 },
  { zip: "08553", name: "Rocky Hill", state: "NJ", county: "Somerset", miles: 25.2 },
  { zip: "18041", name: "East Greenville", state: "PA", county: "Montgomery", miles: 25.2 },
  { zip: "19460", name: "Phoenixville", state: "PA", county: "Chester", miles: 25.5 },
  { zip: "08106", name: "Audubon", state: "NJ", county: "Camden", miles: 25.5 },
  { zip: "08033", name: "Haddonfield", state: "NJ", county: "Camden", miles: 25.5 },
  { zip: "08691", name: "Trenton", state: "NJ", county: "Mercer", miles: 25.5 },
  { zip: "08853", name: "Neshanic Station", state: "NJ", county: "Somerset", miles: 25.6 },
  { zip: "19023", name: "Darby", state: "PA", county: "Delaware", miles: 25.7 },
  { zip: "08030", name: "Gloucester City", state: "NJ", county: "Camden", miles: 25.7 },
  { zip: "08048", name: "Lumberton", state: "NJ", county: "Burlington", miles: 25.7 },
  { zip: "18055", name: "Hellertown", state: "PA", county: "Northampton", miles: 25.8 },
  { zip: "08528", name: "Kingston", state: "NJ", county: "Somerset", miles: 25.8 },
  { zip: "08041", name: "Jobstown", state: "NJ", county: "Burlington", miles: 25.9 },
  { zip: "08059", name: "Mount Ephraim", state: "NJ", county: "Camden", miles: 25.9 },
  { zip: "08502", name: "Belle Mead", state: "NJ", county: "Somerset", miles: 26.0 },
  { zip: "19018", name: "Clifton Heights", aka: ["Primos"], state: "PA", county: "Delaware", miles: 26.0 },
  { zip: "19435", name: "Frederick", state: "PA", county: "Montgomery", miles: 26.0 },
  { zip: "19112", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 26.0 },
  { zip: "19301", name: "Paoli", state: "PA", county: "Chester", miles: 26.0 },
  { zip: "08561", name: "Windsor", state: "NJ", county: "Mercer", miles: 26.3 },
  { zip: "08035", name: "Haddon Heights", state: "NJ", county: "Camden", miles: 26.3 },
  { zip: "18034", name: "Center Valley", state: "PA", county: "Lehigh", miles: 26.4 },
  { zip: "19064", name: "Springfield", state: "PA", county: "Delaware", miles: 26.5 },
  { zip: "08003", name: "Cherry Hill", state: "NJ", county: "Camden", miles: 26.5 },
  { zip: "08536", name: "Plainsboro", state: "NJ", county: "Middlesex", miles: 26.5 },
  { zip: "19073", name: "Newtown Square", state: "PA", county: "Delaware", miles: 26.6 },
  { zip: "19079", name: "Sharon Hill", state: "PA", county: "Delaware", miles: 26.6 },
  { zip: "08804", name: "Bloomsbury", state: "NJ", county: "Hunterdon", miles: 26.7 },
  { zip: "19525", name: "Gilbertsville", state: "PA", county: "Montgomery", miles: 26.9 },
  { zip: "18070", name: "Palm", state: "PA", county: "Montgomery", miles: 26.9 },
  { zip: "19457", name: "Parker Ford", state: "PA", county: "Chester", miles: 26.9 },
  { zip: "18092", name: "Zionsville", state: "PA", county: "Lehigh", miles: 27.0 },
  { zip: "19472", name: "Sassamansville", state: "PA", county: "Montgomery", miles: 27.0 },
  { zip: "19036", name: "Glenolden", state: "PA", county: "Delaware", miles: 27.1 },
  { zip: "08844", name: "Hillsborough", state: "NJ", county: "Somerset", miles: 27.1 },
  { zip: "18015", name: "Bethlehem", state: "PA", county: "Northampton", miles: 27.2 },
  { zip: "08031", name: "Bellmawr", state: "NJ", county: "Camden", miles: 27.2 },
  { zip: "08045", name: "Lawnside", state: "NJ", county: "Camden", miles: 27.3 },
  { zip: "08007", name: "Barrington", state: "NJ", county: "Camden", miles: 27.3 },
  { zip: "08821", name: "Flagtown", state: "NJ", county: "Somerset", miles: 27.4 },
  { zip: "19153", name: "Philadelphia", state: "PA", county: "Philadelphia", miles: 27.4 },
  { zip: "08801", name: "Annandale", state: "NJ", county: "Hunterdon", miles: 27.4 },
  { zip: "08011", name: "Birmingham", state: "NJ", county: "Burlington", miles: 27.6 },
  { zip: "18042", name: "Easton", state: "PA", county: "Northampton", miles: 27.6 },
  { zip: "19043", name: "Holmes", state: "PA", county: "Delaware", miles: 27.6 },
  { zip: "19070", name: "Morton", state: "PA", county: "Delaware", miles: 27.6 },
  { zip: "08093", name: "Westville", state: "NJ", county: "Gloucester", miles: 27.7 },
  { zip: "19032", name: "Folcroft", state: "PA", county: "Delaware", miles: 27.7 },
  { zip: "08063", name: "National Park", state: "NJ", county: "Gloucester", miles: 27.7 },
  { zip: "19442", name: "Kimberton", state: "PA", county: "Chester", miles: 27.8 },
  { zip: "18056", name: "Hereford", state: "PA", county: "Berks", miles: 27.8 },
  { zip: "19503", name: "Bally", state: "PA", county: "Berks", miles: 27.8 },
  { zip: "08042", name: "Juliustown", state: "NJ", county: "Burlington", miles: 27.9 },
  { zip: "08809", name: "Clinton", state: "NJ", county: "Hunterdon", miles: 27.9 },
  { zip: "19355", name: "Malvern", state: "PA", county: "Chester", miles: 27.9 },
  { zip: "19475", name: "Spring City", state: "PA", county: "Chester", miles: 28.0 },
  { zip: "08078", name: "Runnemede", state: "NJ", county: "Camden", miles: 28.1 },
  { zip: "08049", name: "Magnolia", state: "NJ", county: "Camden", miles: 28.1 },
  { zip: "18049", name: "Emmaus", state: "PA", county: "Lehigh", miles: 28.2 },
  { zip: "19074", name: "Norwood", state: "PA", county: "Delaware", miles: 28.2 },
  { zip: "19464", name: "Pottstown", state: "PA", county: "Montgomery", miles: 28.3 },
  { zip: "08520", name: "Hightstown", state: "NJ", county: "Mercer", miles: 28.5 },
  { zip: "19076", name: "Prospect Park", state: "PA", county: "Delaware", miles: 28.5 },
  { zip: "08501", name: "Allentown", state: "NJ", county: "Monmouth", miles: 28.6 },
  { zip: "19081", name: "Swarthmore", state: "PA", county: "Delaware", miles: 28.7 },
  { zip: "19033", name: "Folsom", state: "PA", county: "Delaware", miles: 28.7 },
  { zip: "19113", name: "Philadelphia", state: "PA", county: "Delaware", miles: 28.7 },
  { zip: "08086", name: "Thorofare", state: "NJ", county: "Gloucester", miles: 28.8 },
  { zip: "08827", name: "Hampton", state: "NJ", county: "Hunterdon", miles: 28.8 },
  { zip: "19504", name: "Barto", state: "PA", county: "Berks", miles: 28.9 },
  { zip: "08029", name: "Glendora", state: "NJ", county: "Camden", miles: 29.0 },
  { zip: "08083", name: "Somerdale", state: "NJ", county: "Camden", miles: 29.1 },
  { zip: "08562", name: "Wrightstown", state: "NJ", county: "Burlington", miles: 29.2 },
  { zip: "08043", name: "Voorhees", state: "NJ", county: "Camden", miles: 29.2 },
  { zip: "19063", name: "Media", state: "PA", county: "Delaware", miles: 29.3 },
  { zip: "08053", name: "Marlton", state: "NJ", county: "Burlington", miles: 29.4 },
  { zip: "08802", name: "Asbury", state: "NJ", county: "Hunterdon", miles: 29.5 },
  { zip: "19545", name: "New Berlinville", state: "PA", county: "Berks", miles: 29.5 },
  { zip: "08512", name: "Cranbury", state: "NJ", county: "Middlesex", miles: 29.6 },
  { zip: "08889", name: "Whitehouse Station", state: "NJ", county: "Hunterdon", miles: 29.6 },
  { zip: "08886", name: "Stewartsville", state: "NJ", county: "Warren", miles: 29.6 },
  { zip: "19078", name: "Ridley Park", state: "PA", county: "Delaware", miles: 29.6 },
  { zip: "08852", name: "Monmouth Junction", state: "NJ", county: "Middlesex", miles: 29.6 },
  { zip: "19029", name: "Essington", state: "PA", county: "Delaware", miles: 29.6 },
  { zip: "19505", name: "Bechtelsville", state: "PA", county: "Berks", miles: 29.7 },
  { zip: "19086", name: "Wallingford", state: "PA", county: "Delaware", miles: 29.8 },
  { zip: "08823", name: "Franklin Park", state: "NJ", county: "Somerset", miles: 29.8 },
  { zip: "08096", name: "Woodbury", state: "NJ", county: "Gloucester", miles: 29.9 },
  { zip: "08824", name: "Kendall Park", state: "NJ", county: "Middlesex", miles: 29.9 },
  { zip: "08084", name: "Stratford", state: "NJ", county: "Camden", miles: 30.0 },
];

/** Each place name once, in order of distance */
export const areaPlaces: string[] = [...new Set(areaZips.map((z) => z.name))];

export interface AreaCounty {
  county: string;
  state: AreaState;
  /** Place names in this county, alphabetical */
  towns: string[];
}

/** Counties inside the circle, Pennsylvania first, each state's nearest county first. */
export const areaCounties: AreaCounty[] = (() => {
  const groups = new Map<string, AreaCounty>();
  for (const z of areaZips) {
    const key = `${z.state}|${z.county}`;
    const g = groups.get(key) ?? { county: z.county, state: z.state, towns: [] };
    if (!g.towns.includes(z.name)) g.towns.push(z.name);
    groups.set(key, g);
  }
  // areaZips is in order of distance, so insertion order is already nearest-first within each state.
  const all = [...groups.values()].map((g) => ({ ...g, towns: [...g.towns].sort((a, b) => a.localeCompare(b)) }));
  return [...all.filter((g) => g.state === "PA"), ...all.filter((g) => g.state === "NJ")];
})();

/** "Bucks County", "Philadelphia" (city and county are the same) */
export const countyName = (c: Pick<AreaCounty, "county">) => (c.county === "Philadelphia" ? "Philadelphia" : `${c.county} County`);

/**
 * Named on the map. The map's own labels already name the bigger towns, so this is only the
 * base the circle is drawn around, which the tiles leave unnamed at this zoom.
 */
export const mapLabels = [{ name: "Jamison", lat: 40.2546, lon: -75.0868 }];

/**
 * Center of the service radius. It comes from Jimmy's private service-origin address, rounded to
 * about half a mile so his home can't be read out of the page. The address itself stays out of this
 * repo and off the site.
 */
export const serviceRadius = { miles: 30, lat: 40.26, lon: -75.08 };

export const serviceZips = new Map<string, string>(areaZips.map((z) => [z.zip, z.name]));
const zipState = new Map<string, AreaState>(areaZips.map((z) => [z.zip, z.state]));

/**
 * The state for an address, from its ZIP. The area spans Pennsylvania and New Jersey, so an address
 * can't just assume PA. Outside the list, the ZIP's first digits decide (they map to states).
 */
export function stateForZip(zip: string): string {
  const known = zipState.get(zip);
  if (known) return known;
  const n = Number(zip.slice(0, 3));
  if (!/^\d{5}$/.test(zip)) return "PA";
  if (n >= 70 && n <= 89) return "NJ";
  if (n >= 100 && n <= 149) return "NY";
  if (n >= 197 && n <= 199) return "DE";
  if (n >= 206 && n <= 219) return "MD";
  return "PA";
}

const clean = (v: string) =>
  v
    .toLowerCase()
    .replace(/,?\s*(pa|pennsylvania|nj|new jersey)\.?$/, "")
    .replace(/\s+(township|twp\.?|borough|boro)$/, "")
    .replace(/[^a-z ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const byName = new Map<string, string>();
for (const z of areaZips) {
  for (const n of [z.name, ...(z.aka ?? [])]) if (!byName.has(clean(n))) byName.set(clean(n), z.name);
}

/**
 * yes: a ZIP or place inside the circle. ask: a real-looking ZIP outside it.
 * unknown: words we can't match to a place. invalid: empty, or digits that aren't a ZIP.
 */
export function lookupArea(
  input: string,
): { status: "yes"; town: string } | { status: "ask" } | { status: "unknown" } | { status: "invalid" } {
  const raw = input.trim();
  if (!raw) return { status: "invalid" };
  const zip = raw.match(/^(\d{5})(-\d{4})?$/)?.[1];
  if (zip) {
    const town = serviceZips.get(zip);
    return town ? { status: "yes", town } : { status: "ask" };
  }
  if (/^[\d\s-]+$/.test(raw)) return { status: "invalid" };
  const town = byName.get(clean(raw));
  return town ? { status: "yes", town } : { status: "unknown" };
}
