/* BIG LWA Arcade: Y8 publisher-approved popularity selection, 2026-11-12.
 * Original slugs and thumbnail images are derived from the Y8 publisher pages,
 * not guessed from titles; 3 legacy GIF thumbnails use their official game pages.
 * All image/game data stays at Y8; BIG LWA does not copy game packages.
 * Third-party player availability is controlled by each publisher.
 * Publisher directory: https://www.y8.com/games_for_your_website?order=popularity
 */
(()=>{'use strict';
 const rows=[
 {
  "title": "Slope",
  "rank": 1,
  "slug": "slope",
  "image": "https://cdn2.y8.com/cloudimage/384903/file/w180h135_webp-8366ef5a1e626206710f6060746de859.webp"
 },
 {
  "title": "Bartender: The Right Mix",
  "rank": 2,
  "slug": "bartender_the_right_mix",
  "image": "https://cdn2.y8.com/cloudimage/384881/file/w180h135_webp-fac6600478e2f1e28cbd81809754d88e.webp"
 },
 {
  "title": "Football Legends 2016",
  "rank": 3,
  "slug": "football_legends_2016",
  "image": "https://cdn2.y8.com/cloudimage/386843/file/w180h135_webp-3f814ae43a0ca513380f9d4d79ee06b4.webp"
 },
 {
  "title": "Moto X3M 2",
  "rank": 4,
  "slug": "moto_x3m_2",
  "image": "https://cdn2.y8.com/cloudimage/384493/file/w180h135_webp-248c5276a2e0da99a3d4c1623dbcc93c.webp"
 },
 {
  "title": "Noughts and Crosses",
  "rank": 5,
  "slug": "noughts_and_crosses",
  "image": "https://cdn2.y8.com/cloudimage/384899/file/w180h135_webp-1b8cd1998916589e6e77583f91f5e99a.webp"
 },
 {
  "title": "Freefall Tournament",
  "rank": 6,
  "slug": "freefall_tournament",
  "image": "https://cdn2.y8.com/cloudimage/384687/file/w180h135_webp-dc4a3fd30ed3e3d5dfd35760a1116929.webp"
 },
 {
  "title": "Skytrip",
  "rank": 7,
  "slug": "skytrip",
  "image": "https://cdn2.y8.com/cloudimage/406015/file/w180h135_webp-7f37b4835637c75e8edb4825024f50ea.webp"
 },
 {
  "title": "Basketball Legends",
  "rank": 8,
  "slug": "basketball_legends",
  "image": "https://cdn2.y8.com/cloudimage/384357/file/w180h135_webp-f59906671b703c3d8967c0c1f6e04e49.webp"
 },
 {
  "title": "Hide Online",
  "rank": 9,
  "slug": "hide_online",
  "image": "https://cdn2.y8.com/cloudimage/384365/file/w180h135_webp-23f150916eb5ed02ded7b7ddbc8ab2d5.webp"
 },
 {
  "title": "Moto X3m 3",
  "rank": 10,
  "slug": "moto_x3m_3",
  "image": "https://cdn2.y8.com/cloudimage/404799/file/w180h135_webp-4c4b568766fefc354c9f7121d43156ea.webp"
 },
 {
  "title": "Military Wars 3D Multiplayer",
  "rank": 11,
  "slug": "military_wars_3d_multiplayer",
  "image": "https://cdn2.y8.com/cloudimage/384473/file/w180h135_webp-3b0974ea35458a7cda46e95dffda8352.webp"
 },
 {
  "title": "Mighty Knight 2",
  "rank": 12,
  "slug": "mighty_knight_2",
  "image": "https://cdn2.y8.com/cloudimage/384479/file/w180h135_webp-db4640bec8aba92780d933cafd0eaad3.webp"
 },
 {
  "title": "Football Legends 2019",
  "rank": 13,
  "slug": "football_legends_2019",
  "image": "https://cdn2.y8.com/cloudimage/403791/file/w180h135_webp-0986a208cc2fd8ae7855db44476b4f90.webp"
 },
 {
  "title": "Master Chess",
  "rank": 14,
  "slug": "master_chess",
  "image": "https://cdn2.y8.com/cloudimage/387013/file/w180h135_webp-520dbb2b483325a9915b5d4ea66df7b5.webp"
 },
 {
  "title": "Crime City 3D",
  "rank": 15,
  "slug": "crime_city_3d",
  "image": "https://img.y8.com/cloud/y8-thumbs/70003/small.gif"
 },
 {
  "title": "Drunken Archers Duel",
  "rank": 16,
  "slug": "drunken_archers_duel",
  "image": "https://cdn2.y8.com/cloudimage/342729/file/w180h135_webp-e2be15d4448b646a166bd929e6fbf0bf.webp"
 },
 {
  "title": "Death Run 3D",
  "rank": 17,
  "slug": "death_run_3d",
  "image": "https://cdn2.y8.com/cloudimage/384681/file/w180h135_webp-826ea0410ee5c54ded8da36c7422e26e.webp"
 },
 {
  "title": "Sniper Clash 3D",
  "rank": 18,
  "slug": "sniper_clash_3d",
  "image": "https://cdn2.y8.com/cloudimage/391001/file/w180h135_webp-20b08ab8639ecd813c89856bb65e1cd9.webp"
 },
 {
  "title": "Mutant Fighting Cup 2",
  "rank": 19,
  "slug": "mutant_fighting_cup_2",
  "image": "https://cdn2.y8.com/cloudimage/403983/file/w180h135_webp-acd1a4759d9e727301c88f49be944646.webp"
 },
 {
  "title": "Halloween Basketball Legends",
  "rank": 20,
  "slug": "halloween_basketball_legends",
  "image": "https://cdn2.y8.com/cloudimage/384395/file/w180h135_webp-e6ab73044d3d06716a55930f3bceef8f.webp"
 },
 {
  "title": "Orion Sandbox",
  "rank": 21,
  "slug": "orion_sandbox",
  "image": "https://cdn2.y8.com/cloudimage/384361/file/w180h135_webp-64dcac3692492d31e9b612e25e9b1b68.webp"
 },
 {
  "title": "Total Tankage",
  "rank": 22,
  "slug": "total_tankage",
  "image": "https://cdn2.y8.com/cloudimage/386835/file/w180h135_webp-e18ca79bdd529a604e5950e3171838de.webp"
 },
 {
  "title": "Rocking Sky Trip",
  "rank": 23,
  "slug": "rolling_sky_trip",
  "image": "https://cdn2.y8.com/cloudimage/406461/file/w180h135_webp-a8007f293bac4b4bab7e73dcf7e18825.webp"
 },
 {
  "title": "Four Colors",
  "rank": 24,
  "slug": "four_colors",
  "image": "https://cdn2.y8.com/cloudimage/383217/file/w180h135_webp-ce4c6e5a48d0a19590047f9cc4907159.webp"
 },
 {
  "title": "Knife Hit",
  "rank": 25,
  "slug": "knife_hit_",
  "image": "https://cdn2.y8.com/cloudimage/403835/file/w180h135_webp-36bdd03ff3ffd19219482e998bcbc4a0.webp"
 },
 {
  "title": "Impossible Bike Stunt 3D",
  "rank": 26,
  "slug": "impossible_bike_stunt_3d",
  "image": "https://cdn2.y8.com/cloudimage/404157/file/w180h135_webp-b2b389799837ecb2fee5907b31e07d06.webp"
 },
 {
  "title": "Russian Extreme Offroad",
  "rank": 27,
  "slug": "russian_extreme_offroad",
  "image": "https://cdn2.y8.com/cloudimage/404731/file/w180h135_webp-ee31526f9a7c1dabdb5380cd1b0f3e74.webp"
 },
 {
  "title": "Grandpa Run 3D",
  "rank": 28,
  "slug": "grandpa_run_3d",
  "image": "https://cdn2.y8.com/cloudimage/384523/file/w180h135_webp-2408b06205b12e660c39b7348ec26564.webp"
 },
 {
  "title": "Orion Sandbox Enhanced",
  "rank": 29,
  "slug": "orion_sandbox_enhanced",
  "image": "https://cdn2.y8.com/cloudimage/406435/file/w180h135_webp-10ffde9ef8971b74b4a66d4dead54960.webp"
 },
 {
  "title": "Pixel Road Taxi Depot",
  "rank": 30,
  "slug": "pixel_road_taxi_depot",
  "image": "https://cdn2.y8.com/cloudimage/383819/file/w180h135_webp-dc27c043b318c21b7b98365c634db5ec.webp"
 },
 {
  "title": "Bartender The Wedding",
  "rank": 31,
  "slug": "bartender_the_wedding",
  "image": "https://cdn2.y8.com/cloudimage/406617/file/w180h135_webp-3555b33027c474afae21da77447f9489.webp"
 },
 {
  "title": "Parkour GO 2: Urban",
  "rank": 32,
  "slug": "parkour_go_2_urban",
  "image": "https://cdn2.y8.com/cloudimage/381225/file/w180h135_webp-70440e612e57fa17b6259978f5e1b39d.webp"
 },
 {
  "title": "Max Fury Death Racer",
  "rank": 33,
  "slug": "max_fury",
  "image": "https://cdn2.y8.com/cloudimage/403969/file/w180h135_webp-5b8578642a171d65f904408169dbf81b.webp"
 },
 {
  "title": "Y8 Football League",
  "rank": 34,
  "slug": "y8_football_league",
  "image": "https://cdn2.y8.com/cloudimage/404965/file/w180h135_webp-c3f65bcd1631a3092bbbbea599f1c0ac.webp"
 },
 {
  "title": "Fun Ear Doctor",
  "rank": 35,
  "slug": "fun_ear_doctor",
  "image": "https://cdn2.y8.com/cloudimage/408073/file/w180h135_webp-654612afe8d962a15acfa77870db407c.webp"
 },
 {
  "title": "Bartender The Celeb Mix",
  "rank": 36,
  "slug": "bartender_the_celeb_mix",
  "image": "https://cdn2.y8.com/cloudimage/403789/file/w180h135_webp-a155e99987520e87a3717d07966477d8.webp"
 },
 {
  "title": "Y8 Snakes",
  "rank": 37,
  "slug": "y8_snakes",
  "image": "https://cdn2.y8.com/cloudimage/383831/file/w180h135_webp-4f229c0bf0b4721990e8cf59807adb39.webp"
 },
 {
  "title": "Death Squad: The Last Mission",
  "rank": 38,
  "slug": "death_squad_the_last_mission",
  "image": "https://cdn2.y8.com/cloudimage/384601/file/w180h135_webp-6473071209a9f3fef4c59982edf7a532.webp"
 },
 {
  "title": "G-Switch 2",
  "rank": 39,
  "slug": "g-switch_2",
  "image": "https://cdn2.y8.com/cloudimage/397469/file/w180h135_webp-da3e108adf910f35850e1a9c9daba399.webp"
 },
 {
  "title": "Moto Trials Junkyard 2",
  "rank": 40,
  "slug": "moto_trials_junkyard_2",
  "image": "https://cdn2.y8.com/cloudimage/385855/file/w180h135_webp-787b0965f37754d74458eed3c0d37d9d.webp"
 },
 {
  "title": "Knee Surgery Simulator",
  "rank": 41,
  "slug": "knee_surgery_simulator",
  "image": "https://cdn2.y8.com/cloudimage/408091/file/w180h135_webp-96fe0440938c7761ea1aab11c067e73d.webp"
 },
 {
  "title": "Murder: To Kill or Not to Kill",
  "rank": 42,
  "slug": "murder_to_kill_or_not_to_kill",
  "image": "https://cdn2.y8.com/cloudimage/403929/file/w180h135_webp-ea97ab280227ecfe44532d591b5a5eb9.webp"
 },
 {
  "title": "Silent Sniper",
  "rank": 43,
  "slug": "silent_sniper",
  "image": "https://cdn2.y8.com/cloudimage/406019/file/w180h135_webp-2614b9d1996b13495cf59ca3aebc6e38.webp"
 },
 {
  "title": "Penalty Kicks",
  "rank": 44,
  "slug": "penalty_kicks",
  "image": "https://cdn2.y8.com/cloudimage/386899/file/w180h135_webp-4379cd48b3355c9bfb3e6398e69b0fff.webp"
 },
 {
  "title": "Crime City 3D 2",
  "rank": 45,
  "slug": "crime_city_3d_2",
  "image": "https://cdn2.y8.com/cloudimage/384439/file/w180h135_webp-a90f0e94aca440b92bf2021b311f11c5.webp"
 },
 {
  "title": "Stunt Racers Extreme",
  "rank": 46,
  "slug": "stunt_racers_extreme",
  "image": "https://cdn2.y8.com/cloudimage/405733/file/w180h135_webp-8708d8fc85943346d8e184f652f88f5f.webp"
 },
 {
  "title": "Funny Throat Doctor",
  "rank": 47,
  "slug": "funny_throat_doctor",
  "image": "https://cdn2.y8.com/cloudimage/408095/file/w180h135_webp-0aad3d9732583a88d22f6d9991023bda.webp"
 },
 {
  "title": "Pet Connect",
  "rank": 48,
  "slug": "pet_connect",
  "image": "https://cdn2.y8.com/cloudimage/384875/file/w180h135_webp-8a685bc896584a4f77346f9cbc110446.webp"
 },
 {
  "title": "Bike Riders",
  "rank": 49,
  "slug": "bike_riders",
  "image": "https://cdn2.y8.com/cloudimage/384457/file/w180h135_webp-5710e8d7fa9e4d97137a925a31693944.webp"
 },
 {
  "title": "Decor my Cupcakes",
  "rank": 50,
  "slug": "baking_cupcakes",
  "image": "https://cdn2.y8.com/cloudimage/401165/file/w180h135_webp-489512b7a4b45fd03d507f286ea146a9.webp"
 },
 {
  "title": "Bus Parking 3D World",
  "rank": 51,
  "slug": "bus_parking_3d_world",
  "image": "https://cdn2.y8.com/cloudimage/384477/file/w180h135_webp-e65af9c159779353e6e548ec69eea2ca.webp"
 },
 {
  "title": "Goal Keeper Challenge",
  "rank": 52,
  "slug": "goal_keeper_challenge",
  "image": "https://cdn2.y8.com/cloudimage/406141/file/w180h135_webp-76d45bcdfa9e67dcaf875aa429c42d16.webp"
 },
 {
  "title": "Call of Zombies",
  "rank": 53,
  "slug": "call_of_zombies",
  "image": "https://cdn2.y8.com/cloudimage/384497/file/w180h135_webp-3ded734de38d67ea27c547e4c74a028e.webp"
 },
 {
  "title": "Mutant Fighting Arena",
  "rank": 54,
  "slug": "mutant_fighting_arena",
  "image": "https://cdn2.y8.com/cloudimage/383507/file/w180h135_webp-4ba9d2e71e383c2d90579c415de21e9d.webp"
 },
 {
  "title": "Mayhem Racing",
  "rank": 55,
  "slug": "mayhem_racing",
  "image": "https://cdn2.y8.com/cloudimage/406131/file/w180h135_webp-7d8789d6a53b82ff246443b928b956a7.webp"
 },
 {
  "title": "Battle Robot Wolf Age",
  "rank": 56,
  "slug": "battle_robot_wolf_age",
  "image": "https://cdn2.y8.com/cloudimage/405021/file/w180h135_webp-997f3900f0a863bee719b9fad50a6622.webp"
 },
 {
  "title": "Christmas Dentist",
  "rank": 57,
  "slug": "christmas_dentist",
  "image": "https://cdn2.y8.com/cloudimage/408259/file/w180h135_webp-d1bd810b556384496c2aea15b90714e1.webp"
 },
 {
  "title": "Miami Rex",
  "rank": 58,
  "slug": "miami_rex",
  "image": "https://cdn2.y8.com/cloudimage/404161/file/w180h135_webp-6b9a78aa3eda42276a3f53513da27237.webp"
 },
 {
  "title": "Slope Multiplayer",
  "rank": 59,
  "slug": "slope_multiplayer",
  "image": "https://cdn2.y8.com/cloudimage/406799/file/w180h135_webp-b6a25144dfb129a1c0a69f450fd09f74.webp"
 },
 {
  "title": "Sniper Assault Squad",
  "rank": 60,
  "slug": "sniper_assault_squad",
  "image": "https://cdn2.y8.com/cloudimage/343061/file/w180h135_webp-5e4d46293d9f06a7c4e79224ab445f7b.webp"
 },
 {
  "title": "Head Hunter Reborn",
  "rank": 61,
  "slug": "head_hunter_reborn",
  "image": "https://cdn2.y8.com/cloudimage/384647/file/w180h135_webp-a9a0bbc14f4a7dbec57709af26856a48.webp"
 },
 {
  "title": "Rescue Six",
  "rank": 62,
  "slug": "rescue_six",
  "image": "https://cdn2.y8.com/cloudimage/405729/file/w180h135_webp-31ddb282244a327a29ce3c2c87956355.webp"
 },
 {
  "title": "Grand Race",
  "rank": 63,
  "slug": "grand_race",
  "image": "https://cdn2.y8.com/cloudimage/380155/file/w180h135_webp-c0b7d39a677917677b07a0dbe1886fbb.webp"
 },
 {
  "title": "MaZe",
  "rank": 64,
  "slug": "maze",
  "image": "https://cdn2.y8.com/cloudimage/405949/file/w180h135_webp-564ce74c9211067db800acb4d9ec61ac.webp"
 },
 {
  "title": "Truck Driver Crazy Road 2",
  "rank": 65,
  "slug": "truck_driver_crazy_road_2",
  "image": "https://cdn2.y8.com/cloudimage/404137/file/w180h135_webp-086b8f6576dffdb387a2db8bab51493b.webp"
 },
 {
  "title": "Stickman Boost! 2",
  "rank": 66,
  "slug": "stickman_boost_2",
  "image": "https://cdn2.y8.com/cloudimage/404021/file/w180h135_webp-6b63dc95e28cd4e6270095c115a12723.webp"
 },
 {
  "title": "Masked Shooters Multiplayer Edition",
  "rank": 67,
  "slug": "masked_shooters_multiplayer_edition",
  "image": "https://cdn2.y8.com/cloudimage/404875/file/w180h135_webp-5190e2a909336bffd1d41a621df30760.webp"
 },
 {
  "title": "Punch Boxing Championship",
  "rank": 68,
  "slug": "punch_boxing_championship",
  "image": "https://img.y8.com/cloud/v2-y8-thumbs-small-thumbnails-001/112662/small.gif"
 },
 {
  "title": "Stickman Boost!",
  "rank": 69,
  "slug": "stickman_boost",
  "image": "https://cdn2.y8.com/cloudimage/383229/file/w180h135_webp-3ed47af0d218585ef60408f7495145bb.webp"
 },
 {
  "title": "Color Spin",
  "rank": 70,
  "slug": "color_spin",
  "image": "https://cdn2.y8.com/cloudimage/384377/file/w180h135_webp-07cd93401062e11fb7cc9f63c44cbac8.webp"
 },
 {
  "title": "Ultimate TicTacToe",
  "rank": 71,
  "slug": "ultimate_tictactoe",
  "image": "https://cdn2.y8.com/cloudimage/406317/file/w180h135_webp-22e92d8145a6b23258668122ae550726.webp"
 },
 {
  "title": "Car Rush",
  "rank": 72,
  "slug": "car_rush",
  "image": "https://cdn2.y8.com/cloudimage/405485/file/w180h135_webp-c261f57b78ddd71d2a3e0c92a7536509.webp"
 },
 {
  "title": "Moto Xspeed GP",
  "rank": 73,
  "slug": "moto_xspeed_gp",
  "image": "https://cdn2.y8.com/cloudimage/384483/file/w180h135_webp-b5d50375660bd260fdc4d736f7193584.webp"
 },
 {
  "title": "Russian UAZ Offroad Driving 3D",
  "rank": 74,
  "slug": "russian_uaz_offroad_driving_3d",
  "image": "https://cdn2.y8.com/cloudimage/383923/file/w180h135_webp-fc73ca6c394964aa7f80653bb4a0a55e.webp"
 },
 {
  "title": "Catch The Ball",
  "rank": 75,
  "slug": "catch_the_ball",
  "image": "https://cdn2.y8.com/cloudimage/406139/file/w180h135_webp-dd6a948c3d85895aaf448fa68a07d36c.webp"
 },
 {
  "title": "Truck Driver Crazy Road",
  "rank": 76,
  "slug": "truck_driver_crazy_road",
  "image": "https://cdn2.y8.com/cloudimage/384445/file/w180h135_webp-8451ef255c10bb7e30b8f33b7e391525.webp"
 },
 {
  "title": "Swimming Pro",
  "rank": 77,
  "slug": "swimming_pro",
  "image": "https://cdn2.y8.com/cloudimage/405739/file/w180h135_webp-b137b32d8f434c53eea1ea7fb3944426.webp"
 },
 {
  "title": "Snake and Blocks",
  "rank": 78,
  "slug": "snake_and_blocks",
  "image": "https://cdn2.y8.com/cloudimage/405183/file/w180h135_webp-2458f1d1d971d416190f4dd36e2fff1d.webp"
 },
 {
  "title": "My Dreamy Car Makeover",
  "rank": 79,
  "slug": "my_dreamy_car_makeover",
  "image": "https://cdn2.y8.com/cloudimage/406525/file/w180h135_webp-ead44bcc9553dfccf69bdd924b111cc5.webp"
 },
 {
  "title": "Slot Car Racing",
  "rank": 80,
  "slug": "slot_car_racing",
  "image": "https://cdn2.y8.com/cloudimage/403955/file/w180h135_webp-47edf36d5acd425ffa25fb2b1d5a3b97.webp"
 },
 {
  "title": "DD Happy Glass",
  "rank": 81,
  "slug": "dd_happy_glass",
  "image": "https://cdn2.y8.com/cloudimage/403841/file/w180h135_webp-8d92184aeed0a2732d03f8aff4510f87.webp"
 },
 {
  "title": "Leader Strike",
  "rank": 82,
  "slug": "leader_strike",
  "image": "https://cdn2.y8.com/cloudimage/387109/file/w180h135_webp-6688e789909901900369308b456edf08.webp"
 },
 {
  "title": "Air Fighter",
  "rank": 83,
  "slug": "air_fighter",
  "image": "https://cdn2.y8.com/cloudimage/405495/file/w180h135_webp-98f093f899f6ba16f9d8b12193bd6b4a.webp"
 },
 {
  "title": "DownHill Rush",
  "rank": 84,
  "slug": "downhill_rush",
  "image": "https://cdn2.y8.com/cloudimage/381545/file/w180h135_webp-c07b29b644fde255b7ac064ea113e838.webp"
 },
 {
  "title": "Sniper Mission",
  "rank": 85,
  "slug": "sniper_mission",
  "image": "https://cdn2.y8.com/cloudimage/406145/file/w180h135_webp-94a4557f698c0d6ea653163f072d749d.webp"
 },
 {
  "title": "Archery",
  "rank": 86,
  "slug": "archery",
  "image": "https://cdn2.y8.com/cloudimage/403943/file/w180h135_webp-9c3b4594dd8e765a12a3964a8757f10f.webp"
 },
 {
  "title": "Carol's Haircut Salon",
  "rank": 87,
  "slug": "carol_s_haircut_salon",
  "image": "https://cdn2.y8.com/cloudimage/407633/file/w180h135_webp-812128795fe444e57b2fcae53b72583a.webp"
 },
 {
  "title": "Y8 Space Snakes",
  "rank": 88,
  "slug": "y8_space_snakes",
  "image": "https://cdn2.y8.com/cloudimage/384923/file/w180h135_webp-388aa5e51e2d67fe7ea3757672728f5e.webp"
 },
 {
  "title": "War of Metal",
  "rank": 89,
  "slug": "war_of_metal",
  "image": "https://cdn2.y8.com/cloudimage/384459/file/w180h135_webp-5bda21a6c3f7426c8b60d92d6bfd4991.webp"
 },
 {
  "title": "Rogue Buddies",
  "rank": 90,
  "slug": "rogue_buddies",
  "image": "https://cdn2.y8.com/cloudimage/402641/file/w180h135_webp-ee43babab80e6f750fe6788698ff40a9.webp"
 },
 {
  "title": "Mommy Twin Birth",
  "rank": 91,
  "slug": "mommy_twin_birth",
  "image": "https://cdn2.y8.com/cloudimage/407977/file/w180h135_webp-955dfab83c12a5bfd1b52d4b8bc2c50f.webp"
 },
 {
  "title": "Aurelias Foot Injuring",
  "rank": 92,
  "slug": "aurelias_foot_injuring",
  "image": "https://cdn2.y8.com/cloudimage/407959/file/w180h135_webp-d9902d5848f57d502c2af1073126bfeb.webp"
 },
 {
  "title": "Connect 4",
  "rank": 93,
  "slug": "connect_4",
  "image": "https://cdn2.y8.com/cloudimage/348341/file/w180h135_webp-5fb3143f49443f675a2efc2e5871faa9.webp"
 },
 {
  "title": "Formula XSpeed 3D",
  "rank": 94,
  "slug": "formula_xspeed_3d",
  "image": "https://cdn2.y8.com/cloudimage/384507/file/w180h135_webp-2cb00ce1de358272387ad9fc9551b4fa.webp"
 },
 {
  "title": "Big Restaurant Chef",
  "rank": 95,
  "slug": "big_restaurant_chef",
  "image": "https://cdn2.y8.com/cloudimage/402643/file/w180h135_webp-14bdb1327d65a9b1667fbbbe4f954534.webp"
 },
 {
  "title": "Bike Rider 2: Armageddon",
  "rank": 96,
  "slug": "bike_rider_2_armageddon",
  "image": "https://cdn2.y8.com/cloudimage/383275/file/w180h135_webp-b812be78b2fb3946d51ccf54cf5a83c8.webp"
 },
 {
  "title": "Paris Rex",
  "rank": 97,
  "slug": "paris_rex",
  "image": "https://cdn2.y8.com/cloudimage/384511/file/w180h135_webp-740e873997e1d1e34a8f93d6e482116e.webp"
 },
 {
  "title": "Bartender Perfect Mix",
  "rank": 98,
  "slug": "bartender_perfect_mix",
  "image": "https://cdn2.y8.com/cloudimage/383579/file/w180h135_webp-71945474e6431e7acb2c62483dcab26c.webp"
 },
 {
  "title": "Sea Monsters Food Duel",
  "rank": 99,
  "slug": "sea_monsters_food_duel",
  "image": "https://cdn2.y8.com/cloudimage/406035/file/w180h135_webp-5712480c5693275b28420e88d7661750.webp"
 },
 {
  "title": "Hockey Legends",
  "rank": 100,
  "slug": "hockey_legends",
  "image": "https://cdn2.y8.com/cloudimage/383911/file/w180h135_webp-772422e5b2b160c18e0fb20f3cc66b7a.webp"
 },
 {
  "title": "XRacer",
  "rank": 101,
  "slug": "xracer",
  "image": "https://cdn2.y8.com/cloudimage/386931/file/w180h135_webp-1b59aebacec699753d04fece818b47ce.webp"
 },
 {
  "title": "Snake and Ladders",
  "rank": 102,
  "slug": "snake_and_ladders",
  "image": "https://cdn2.y8.com/cloudimage/405425/file/w180h135_webp-39fcdc029ceab8fbd770f8c03843ac18.webp"
 },
 {
  "title": "Highway Squad",
  "rank": 103,
  "slug": "highway_squad",
  "image": "https://cdn2.y8.com/cloudimage/405231/file/w180h135_webp-c12d2c81f418d44214c1f06f924aac2a.webp"
 },
 {
  "title": "8 Ball Pool",
  "rank": 104,
  "slug": "8_ball_pool",
  "image": "https://cdn2.y8.com/cloudimage/384915/file/w180h135_webp-7af70f791a1491cc62ec6d8db578b6f8.webp"
 },
 {
  "title": "Rogue Within",
  "rank": 105,
  "slug": "rogue_within",
  "image": "https://cdn2.y8.com/cloudimage/405725/file/w180h135_webp-e496ad74d1c58753536ead44c9d87b90.webp"
 },
 {
  "title": "Children Laundry",
  "rank": 106,
  "slug": "children_laundry",
  "image": "https://cdn2.y8.com/cloudimage/406527/file/w180h135_webp-369b4aec42c7d5f38a2bd317e8a7868d.webp"
 },
 {
  "title": "Cliff Diving",
  "rank": 107,
  "slug": "cliff_diving",
  "image": "https://cdn2.y8.com/cloudimage/343129/file/w180h135_webp-d62482fd9f6b0008a3a3cf033648b5ff.webp"
 },
 {
  "title": "Princess Hairdo",
  "rank": 108,
  "slug": "princess_hairdo",
  "image": "https://cdn2.y8.com/cloudimage/406701/file/w180h135_webp-5a2ef9664de33e037dea3d74465ce62d.webp"
 },
 {
  "title": "Princess' Pup Rescue",
  "rank": 109,
  "slug": "princess_pup_rescue",
  "image": "https://cdn2.y8.com/cloudimage/406929/file/w180h135_webp-39a6c94de00654f7627af87bce6bc976.webp"
 },
 {
  "title": "Gods of Arena",
  "rank": 110,
  "slug": "gods_of_arena",
  "image": "https://cdn2.y8.com/cloudimage/407811/file/w180h135_webp-d1369acf5fdb34f64541dbda1d1c915b.webp"
 },
 {
  "title": "Man Haircut",
  "rank": 111,
  "slug": "man_haircut",
  "image": "https://cdn2.y8.com/cloudimage/406501/file/w180h135_webp-ae9fdb2969285cfc3448db4c013c4345.webp"
 },
 {
  "title": "Cooking Steak Dinner",
  "rank": 112,
  "slug": "cooking_steak_dinner",
  "image": "https://cdn2.y8.com/cloudimage/407271/file/w180h135_webp-75dae438295d0db3905089f83a156e52.webp"
 },
 {
  "title": "Newborn Baby",
  "rank": 113,
  "slug": "newborn_baby",
  "image": "https://cdn2.y8.com/cloudimage/406489/file/w180h135_webp-a9748589685a0bda1081b349d7f02712.webp"
 },
 {
  "title": "Battle Robot Samurai Age",
  "rank": 114,
  "slug": "battle_robot_samurai_age",
  "image": "https://cdn2.y8.com/cloudimage/383647/file/w180h135_webp-73ed8ecc7f1eb389a52f4c9607e3e26f.webp"
 },
 {
  "title": "Warzone Mercenaries",
  "rank": 115,
  "slug": "warzone_mercenaries",
  "image": "https://cdn2.y8.com/cloudimage/406443/file/w180h135_webp-26c26cdcd514c1ca7d0368c01a367e62.webp"
 },
 {
  "title": "Birthday Cake for Mom",
  "rank": 116,
  "slug": "birthday_cake_for_mom",
  "image": "https://cdn2.y8.com/cloudimage/385717/file/w180h135_webp-e5ec547043f31b30dbc5f548ea19d909.webp"
 },
 {
  "title": "Cute Lips Plastic Surgery",
  "rank": 117,
  "slug": "cute_lips_plastic_surgery",
  "image": "https://cdn2.y8.com/cloudimage/407635/file/w180h135_webp-6e1a6e67c5fde1b7e881ae78b8ecf25c.webp"
 },
 {
  "title": "Epic Clicker",
  "rank": 118,
  "slug": "epic_clicker_saga_of_middle_earth",
  "image": "https://cdn2.y8.com/cloudimage/384619/file/w180h135_webp-1e6021c97e8eb6b2a9a26ced9f4e7b4d.webp"
 },
 {
  "title": "Mega Mechs Assembling",
  "rank": 119,
  "slug": "mega_mechs_assembling",
  "image": "https://cdn2.y8.com/cloudimage/384403/file/w180h135_webp-6ab6faa0103a8b53825c7622e0e8010f.webp"
 },
 {
  "title": "Blonde Sofia: Tartar Removal",
  "rank": 120,
  "slug": "blonde_sofia_tartar_removal",
  "image": "https://cdn2.y8.com/cloudimage/343193/file/w180h135_webp-e98fc58273a78c97eb88fbc4317b67b8.webp"
 },
 {
  "title": "Water Scooter Mania",
  "rank": 121,
  "slug": "water_scooter_mania",
  "image": "https://cdn2.y8.com/cloudimage/383659/file/w180h135_webp-65965d217b566b569ca1fb5af425b5dc.webp"
 },
 {
  "title": "MTB Pro Racer",
  "rank": 122,
  "slug": "mtb_pro_racer",
  "image": "https://cdn2.y8.com/cloudimage/403953/file/w180h135_webp-e1aabd075a5dcc64baacff972bcf719b.webp"
 },
 {
  "title": "Blocky trials",
  "rank": 123,
  "slug": "blocky_trials",
  "image": "https://cdn2.y8.com/cloudimage/405013/file/w180h135_webp-494a2c57f41613eca61f80186bd95a4f.webp"
 },
 {
  "title": "Pizza Party",
  "rank": 124,
  "slug": "pizza_party",
  "image": "https://cdn2.y8.com/cloudimage/405723/file/w180h135_webp-844203d92d0d1e50359ec91d0ab4b8e4.webp"
 },
 {
  "title": "RC Super Racer",
  "rank": 125,
  "slug": "rc_super_racer",
  "image": "https://cdn2.y8.com/cloudimage/383909/file/w180h135_webp-2d36ce79c176747ea880c864b905159d.webp"
 },
 {
  "title": "Boy and Girl Fashion Couple",
  "rank": 126,
  "slug": "boy_and_girl_fashion_couple",
  "image": "https://cdn2.y8.com/cloudimage/407949/file/w180h135_webp-81b2d0f2d690f877c944d5dbe57ef1bc.webp"
 },
 {
  "title": "Coloring 16 Cars",
  "rank": 127,
  "slug": "coloring_16_cars",
  "image": "https://cdn2.y8.com/cloudimage/342859/file/w180h135_webp-d11ad4189865a016df6d820a82921f1a.webp"
 },
 {
  "title": "Fighter Aircraft Pilot",
  "rank": 128,
  "slug": "fighter_aircraft_pilot",
  "image": "https://cdn2.y8.com/cloudimage/384555/file/w180h135_webp-29d17453f9c0bb449519bff973749634.webp"
 },
 {
  "title": "Traffic Road",
  "rank": 129,
  "slug": "traffic_road",
  "image": "https://cdn2.y8.com/cloudimage/408263/file/w180h135_webp-2703c524eedb337a8559eb2d5fd4ce3f.webp"
 },
 {
  "title": "Churros Ice Cream",
  "rank": 130,
  "slug": "churros_ice_cream",
  "image": "https://cdn2.y8.com/cloudimage/408087/file/w180h135_webp-aedf64cf4073d2d1c5372a461029395d.webp"
 },
 {
  "title": "Super Drift 4",
  "rank": 131,
  "slug": "super_drift_4",
  "image": "https://cdn2.y8.com/cloudimage/406593/file/w180h135_webp-72872200d0b447c73351e90156727486.webp"
 },
 {
  "title": "Make a Car Simulator",
  "rank": 132,
  "slug": "make_a_car_simulator",
  "image": "https://cdn2.y8.com/cloudimage/383665/file/w180h135_webp-c517993b0ac82e54a7a1e3f05d128fee.webp"
 },
 {
  "title": "Parkour GO",
  "rank": 133,
  "slug": "parkour_go",
  "image": "https://cdn2.y8.com/cloudimage/384385/file/w180h135_webp-4576d8986ec09a326b59b6910d911875.webp"
 },
 {
  "title": "Foosball",
  "rank": 134,
  "slug": "foosball",
  "image": "https://cdn2.y8.com/cloudimage/405391/file/w180h135_webp-3e8e65ef11b29bec4b04ef34f5830189.webp"
 },
 {
  "title": "Andrea Smile Award",
  "rank": 135,
  "slug": "andrea_smile_award",
  "image": "https://cdn2.y8.com/cloudimage/407925/file/w180h135_webp-19c389b59028d81d9ca005ebb5b4a7b4.webp"
 },
 {
  "title": "Battle Robot T-Rex Age",
  "rank": 136,
  "slug": "battle_robot_t-rex_age",
  "image": "https://cdn2.y8.com/cloudimage/383817/file/w180h135_webp-2a43a234adcf06d6eb20e1a7893dd00c.webp"
 },
 {
  "title": "Smilodon Rampage",
  "rank": 137,
  "slug": "smilodon_rampage",
  "image": "https://cdn2.y8.com/cloudimage/384465/file/w180h135_webp-8af00fe318eb839fb1b7dca360a62954.webp"
 },
 {
  "title": "SuperMoto GT",
  "rank": 138,
  "slug": "supermoto_gt",
  "image": "https://cdn2.y8.com/cloudimage/384423/file/w180h135_webp-73467b1e47cd8574044eaeb73f23850c.webp"
 },
 {
  "title": "Coach Bus Simulator",
  "rank": 139,
  "slug": "coach_bus_simulator",
  "image": "https://cdn2.y8.com/cloudimage/407561/file/w180h135_webp-99d629ad5fe2e5f1b73fd3776851ec34.webp"
 },
 {
  "title": "Stray Puppy Care",
  "rank": 140,
  "slug": "stray_puppy_care",
  "image": "https://cdn2.y8.com/cloudimage/406509/file/w180h135_webp-b795470e7aaca0c65227e23b8e2f4951.webp"
 },
 {
  "title": "Rina Ent Ache Problems",
  "rank": 141,
  "slug": "rina_ent_ache_problems",
  "image": "https://cdn2.y8.com/cloudimage/407823/file/w180h135_webp-8dac4d5944fd418c964ce66bfc787dc7.webp"
 },
 {
  "title": "The Evacuation",
  "rank": 142,
  "slug": "the_evacuation",
  "image": "https://cdn2.y8.com/cloudimage/383511/file/w180h135_webp-935f480365b5d014647dbd9c213078f4.webp"
 },
 {
  "title": "Diseviled 3: Stolen Kingdom",
  "rank": 143,
  "slug": "diseviled_3_stolen_kingdom",
  "image": "https://cdn2.y8.com/cloudimage/406267/file/w180h135_webp-b5911509fb7b49a1dab399a59ef03843.webp"
 },
 {
  "title": "Bus Parking 3D World 2",
  "rank": 144,
  "slug": "bus_parking_3d_world_2",
  "image": "https://cdn2.y8.com/cloudimage/405481/file/w180h135_webp-ee9614aecab129343b98c5ba0692e66d.webp"
 },
 {
  "title": "SuperBike GTX",
  "rank": 145,
  "slug": "superbike_gtx",
  "image": "https://cdn2.y8.com/cloudimage/403829/file/w180h135_webp-926297299509a282e45ab28ffe032189.webp"
 },
 {
  "title": "Airplane Parking Academy 3D",
  "rank": 146,
  "slug": "airplane_parking_academy_3d",
  "image": "https://cdn2.y8.com/cloudimage/384543/file/w180h135_webp-fb9e4d9013c99715682de9aa7d527193.webp"
 },
 {
  "title": "Call of Zombies 2",
  "rank": 147,
  "slug": "call_of_zombies_2",
  "image": "https://cdn2.y8.com/cloudimage/384935/file/w180h135_webp-c9bda502e3bda1f23d8cec4b3ff2bb8f.webp"
 },
 {
  "title": "Box Tower",
  "rank": 148,
  "slug": "box_tower",
  "image": "https://cdn2.y8.com/cloudimage/405945/file/w180h135_webp-5539054fb7159bce117e6817d6504779.webp"
 },
 {
  "title": "Carnival Mania Collection",
  "rank": 149,
  "slug": "carnival_mania_collection",
  "image": "https://cdn2.y8.com/cloudimage/407813/file/w180h135_webp-15ede28964244d89cdc8dc585dfb3bf1.webp"
 },
 {
  "title": "Drunken Boxers",
  "rank": 150,
  "slug": "drunken_boxers",
  "image": "https://cdn2.y8.com/cloudimage/384455/file/w180h135_webp-fac0d6997ca1b96e559df4fa97089b75.webp"
 },
 {
  "title": "Rooftop Battles",
  "rank": 151,
  "slug": "rooftop_battles",
  "image": "https://cdn2.y8.com/cloudimage/406931/file/w180h135_webp-3a6d04e4493ff570fe9e8abeb319fd08.webp"
 },
 {
  "title": "Soccer Champ",
  "rank": 152,
  "slug": "soccer_champ",
  "image": "https://cdn2.y8.com/cloudimage/404159/file/w180h135_webp-ba6ff1de49414b99ba8eebcc2940d147.webp"
 },
 {
  "title": "Forest Invasion",
  "rank": 153,
  "slug": "forest_invasion",
  "image": "https://cdn2.y8.com/cloudimage/384911/file/w180h135_webp-3baa2cc1749b8b859850633833cb0e6e.webp"
 },
 {
  "title": "The Best Fashion Designer",
  "rank": 154,
  "slug": "the_best_fashion_designer",
  "image": "https://cdn2.y8.com/cloudimage/407847/file/w180h135_webp-78f5d0fc3459f0af70aba1029e3b086a.webp"
 },
 {
  "title": "Family Dressup",
  "rank": 155,
  "slug": "family_dressup",
  "image": "https://cdn2.y8.com/cloudimage/407937/file/w180h135_webp-e4e0ad9819f375a8f077ff799ab7c9a7.webp"
 },
 {
  "title": "Flirting Makeover",
  "rank": 156,
  "slug": "flirting_makeover",
  "image": "https://cdn2.y8.com/cloudimage/406915/file/w180h135_webp-4fea424b86035212a269cfb2604b155d.webp"
 },
 {
  "title": "Spiders Arena",
  "rank": 157,
  "slug": "spiders_arena",
  "image": "https://cdn2.y8.com/cloudimage/405497/file/w180h135_webp-566b0abc516169918d74a7b2670dd3eb.webp"
 },
 {
  "title": "Jelly Friend",
  "rank": 158,
  "slug": "jelly_friend",
  "image": "https://cdn2.y8.com/cloudimage/403959/file/w180h135_webp-82213fbee9ccef104ec67b2e8047830e.webp"
 },
 {
  "title": "Hair Makeover Dating",
  "rank": 159,
  "slug": "hair_makeover_dating",
  "image": "https://cdn2.y8.com/cloudimage/406607/file/w180h135_webp-18ebad7022b7bb8e75eb02be5a60d110.webp"
 },
 {
  "title": "Woblox",
  "rank": 160,
  "slug": "woblox",
  "image": "https://cdn2.y8.com/cloudimage/403949/file/w180h135_webp-311a34262e22454900963dfed2dd6320.webp"
 },
 {
  "title": "Noughts and Crosses Halloween",
  "rank": 161,
  "slug": "noughts_and_crosses_halloween",
  "image": "https://cdn2.y8.com/cloudimage/406153/file/w180h135_webp-c78c4823292d575a5571cbfab43bc866.webp"
 },
 {
  "title": "Wheel of Fortunes",
  "rank": 162,
  "slug": "wheel_of_fortune",
  "image": "https://cdn2.y8.com/cloudimage/405239/file/w180h135_webp-fc4322cebd49a1d411ecf3e2c67e4b0f.webp"
 },
 {
  "title": "Ice Cream",
  "rank": 163,
  "slug": "ice_cream_flash",
  "image": "https://cdn2.y8.com/cloudimage/409109/file/w180h135_webp-01016a83d1d392256641137cc503068b.webp"
 },
 {
  "title": "Cute Camryn Nose Treatment",
  "rank": 164,
  "slug": "cute_camryn_nose_treatment",
  "image": "https://cdn2.y8.com/cloudimage/406699/file/w180h135_webp-94203fa1b68dfea7c1a0c3fc94a82150.webp"
 },
 {
  "title": "Shopping with Pop",
  "rank": 165,
  "slug": "shopping_with_pop",
  "image": "https://cdn2.y8.com/cloudimage/386063/file/w180h135_webp-f50b0fa69cf1fa0530ec236fd6aed9c8.webp"
 },
 {
  "title": "Battle Towers",
  "rank": 166,
  "slug": "battle_towers",
  "image": "https://img.y8.com/cloud/y8-thumbs/94820/small.gif"
 },
 {
  "title": "Cool Boys Makeover",
  "rank": 167,
  "slug": "cool_boys_makeover",
  "image": "https://cdn2.y8.com/cloudimage/407947/file/w180h135_webp-535effda126fa7599ece08061ab12b62.webp"
 },
 {
  "title": "NexGen Tennis",
  "rank": 168,
  "slug": "nexgen_tennis",
  "image": "https://cdn2.y8.com/cloudimage/384921/file/w180h135_webp-7364f514bba94dc1d1c47bd7a596b93f.webp"
 },
 {
  "title": "Let's Journey",
  "rank": 169,
  "slug": "let_s_journey",
  "image": "https://cdn2.y8.com/cloudimage/408183/file/w180h135_webp-fd41f09e9b7ec3b0be0adb7afaea83e6.webp"
 },
 {
  "title": "Noughts and Crosses Christmas",
  "rank": 170,
  "slug": "noughts_and_crosses_christmas",
  "image": "https://cdn2.y8.com/cloudimage/406237/file/w180h135_webp-ba3f3b4350a7b84ea06578dcdea9d2ec.webp"
 },
 {
  "title": "TTMA Arena",
  "rank": 171,
  "slug": "ttma_arena",
  "image": "https://cdn2.y8.com/cloudimage/405489/file/w180h135_webp-6e7ca01c577c25209d46085cbb0de824.webp"
 },
 {
  "title": "Hotdog Shop",
  "rank": 172,
  "slug": "hotdog_shop",
  "image": "https://cdn2.y8.com/cloudimage/408153/file/w180h135_webp-65ad69156f2ba8a07f4d1aee7d1e34b7.webp"
 },
 {
  "title": "Royal Dentist",
  "rank": 173,
  "slug": "royal_dentist",
  "image": "https://cdn2.y8.com/cloudimage/409149/file/w180h135_webp-c61b3b311c8a5189fee7a24a10673dde.webp"
 },
 {
  "title": "Path of Hero",
  "rank": 174,
  "slug": "path_of_hero",
  "image": "https://cdn2.y8.com/cloudimage/383827/file/w180h135_webp-8ca6df0dcdfbf9cf719d72b2d34ea59e.webp"
 },
 {
  "title": "9 Ball Knockout",
  "rank": 175,
  "slug": "9_ball_knockout",
  "image": "https://cdn2.y8.com/cloudimage/405105/file/w180h135_webp-00645cb78768eadc7f8725a3f91e7c9a.webp"
 },
 {
  "title": "Cyber Smilodon Assembly",
  "rank": 176,
  "slug": "cyber_smilodon_assembling",
  "image": "https://cdn2.y8.com/cloudimage/405731/file/w180h135_webp-9674f4f636b67a72b4898983dcfcd7ac.webp"
 },
 {
  "title": "Downhill Ski",
  "rank": 177,
  "slug": "downhill_ski",
  "image": "https://cdn2.y8.com/cloudimage/343145/file/w180h135_webp-bd46c4af9b29b59f935278f90eae4307.webp"
 },
 {
  "title": "Iron Suit: Assemble and Flight",
  "rank": 178,
  "slug": "iron_suit_assemble_and_flight",
  "image": "https://cdn2.y8.com/cloudimage/404883/file/w180h135_webp-208b3132540865bd8d647125dca64e5b.webp"
 },
 {
  "title": "Russian Offroad Pickup Driver",
  "rank": 179,
  "slug": "russian_offroad_pickup_driver",
  "image": "https://cdn2.y8.com/cloudimage/404885/file/w180h135_webp-63a3b5ff9b40b8552034f52ad0d89d64.webp"
 },
 {
  "title": "Snake and Ladder",
  "rank": 180,
  "slug": "snake_and_ladder",
  "image": "https://cdn2.y8.com/cloudimage/384401/file/w180h135_webp-c337cae6576b882ff6d28ecbd3a07ecd.webp"
 },
 {
  "title": "Tanks 3D Online",
  "rank": 181,
  "slug": "tanks_3d_online",
  "image": "https://cdn2.y8.com/cloudimage/406465/file/w180h135_webp-100013fa1eb715db0e0fba3ff1687ba6.webp"
 },
 {
  "title": "Ariana's Pregnant Care",
  "rank": 182,
  "slug": "ariana_s_pregnant_care",
  "image": "https://cdn2.y8.com/cloudimage/407961/file/w180h135_webp-77e14ccc00d3ac991857b635609ec8bb.webp"
 },
 {
  "title": "Puppy House",
  "rank": 183,
  "slug": "puppy_house",
  "image": "https://cdn2.y8.com/cloudimage/406597/file/w180h135_webp-c03ffc80a0f64d21ad68f582bd980d2b.webp"
 },
 {
  "title": "Pinnacle Racer",
  "rank": 184,
  "slug": "pinnacle_racer",
  "image": "https://cdn2.y8.com/cloudimage/405715/file/w180h135_webp-28e5550a9fff108d31ad63ae59b624fb.webp"
 },
 {
  "title": "Tattoo Party",
  "rank": 185,
  "slug": "tattoo_party",
  "image": "https://cdn2.y8.com/cloudimage/406511/file/w180h135_webp-c7175319a2ba6ddf538df76d20cb91f9.webp"
 },
 {
  "title": "Dream Wedding Dressup",
  "rank": 186,
  "slug": "dream_wedding_dressup",
  "image": "https://cdn2.y8.com/cloudimage/409119/file/w180h135_webp-c1b55ac76b27434b0c84574e9e826923.webp"
 },
 {
  "title": "StrikeForce Kitty League",
  "rank": 187,
  "slug": "strikeforce_kitty_league",
  "image": "https://cdn2.y8.com/cloudimage/384419/file/w180h135_webp-f82b09a01d9add3972f67c3d4c5808e7.webp"
 },
 {
  "title": "Glam Princess Salon",
  "rank": 188,
  "slug": "glam_princess_salon",
  "image": "https://cdn2.y8.com/cloudimage/407935/file/w180h135_webp-60a6fdc892f7099c951e92cd9928d3bb.webp"
 },
 {
  "title": "Cute Pet Dentist Salon",
  "rank": 189,
  "slug": "cute_pet_dentist_salon",
  "image": "https://cdn2.y8.com/cloudimage/406483/file/w180h135_webp-fad08689b30ece901cf63ec71729d3cc.webp"
 },
 {
  "title": "Little Cupcake Maker",
  "rank": 190,
  "slug": "little_cupcake_maker",
  "image": "https://cdn2.y8.com/cloudimage/407971/file/w180h135_webp-d5e166f8f435b0d8bb6276e2f03c308b.webp"
 },
 {
  "title": "Stallion's Spirit",
  "rank": 191,
  "slug": "stallion_s_spirit",
  "image": "https://cdn2.y8.com/cloudimage/405249/file/w180h135_webp-24f5c2e1311ff2fa634c9393e819267b.webp"
 },
 {
  "title": "The Ultimate Clicker Squad",
  "rank": 192,
  "slug": "the_ultimate_clicker_squad",
  "image": "https://cdn2.y8.com/cloudimage/384949/file/w180h135_webp-b833b2620f398b574ac5014fc8acc7a8.webp"
 },
 {
  "title": "War Heroes",
  "rank": 193,
  "slug": "war_heroes",
  "image": "https://cdn2.y8.com/cloudimage/408167/file/w180h135_webp-6ea91f560ad425a1cd0a0b2f26299dfa.webp"
 },
 {
  "title": "Zombudoy 3 Pirates",
  "rank": 194,
  "slug": "zombudoy_3_pirates",
  "image": "https://cdn2.y8.com/cloudimage/407447/file/w180h135_webp-0ac5f39a25803f38bb4edb54f9b7ae5b.webp"
 },
 {
  "title": "Toy War Robot Therizinosaurus",
  "rank": 195,
  "slug": "toy_war_robot_therizinosaurus",
  "image": "https://cdn2.y8.com/cloudimage/405089/file/w180h135_webp-fa675040589ba2c45c72f8ccc16cb1b9.webp"
 },
 {
  "title": "Princess Castle Wardrobe",
  "rank": 196,
  "slug": "princess_castle_wardrobe",
  "image": "https://cdn2.y8.com/cloudimage/407995/file/w180h135_webp-8780cce63ff4070e802455c2eb3d6d33.webp"
 },
 {
  "title": "Table Tennis Challenge",
  "rank": 197,
  "slug": "table_tennis_challenge",
  "image": "https://cdn2.y8.com/cloudimage/406235/file/w180h135_webp-28efb31f1e0c645fac5a5c0f15d1be52.webp"
 },
 {
  "title": "Valentine Day Spa",
  "rank": 198,
  "slug": "valentine_day_spa",
  "image": "https://cdn2.y8.com/cloudimage/409117/file/w180h135_webp-9cb452b0f81ce749515b61837aa98538.webp"
 },
 {
  "title": "Fashion Pet Doctor",
  "rank": 199,
  "slug": "fashion_pet_doctor",
  "image": "https://cdn2.y8.com/cloudimage/407833/file/w180h135_webp-1b8135568266622bfa1334f7e149c3bf.webp"
 },
 {
  "title": "Blonde Sofia: Ingrown Toenail",
  "rank": 200,
  "slug": "blonde_sofia_ingrown_toenail",
  "image": "https://cdn2.y8.com/cloudimage/343195/file/w180h135_webp-d15e7fca4be12a6292617ce3c18d81ac.webp"
 }
];
 const getCategory=title=>{
  const t=title.toLowerCase();
  if(/moto|bike|racer|racing|race|car(?:s)?\b|driv|offroad|taxi|truck|parking|formula|bus|traffic|scooter|drift|speed|mtb|road/.test(t))return 'Driving & Racing';
  if(/football|basketball|soccer|penalty|hockey|goal keeper|boxing|swimming|pool|tennis|foosball|ski|cliff diving|archery|sport|olympic/.test(t))return 'Sports';
  if(/sniper|shoot|war|fighting|tank|combat|rescue|zomb|murder|squad|assault|gun|battle|mutant|robot|sword|knight|parkour|military|freefall|hunter|soldier|fighter|orion sandbox|maze of hero|hide online|drunken archers/.test(t))return 'Action & Adventure';
  if(/chess|connect|color|puzzle|maze|block|tictac|tic tac|noughts|four colors|jelly|snake|word|tower|clicker|math|solitaire|logic|sudoku|box tower/.test(t))return 'Puzzles & Strategy';
  if(/fashion|makeover|doctor|surgery|salon|dress|hair|kitchen|dinner|cake|cooking|baby|puppy|pet|princess|food|wedding|cute|lip|smile|tattoo|laundry|shopping|family|dentist|ice cream|spa|care|make a|makeup|restaurant|bartender|mother|mommy/.test(t))return 'Life & Creative';
  return 'Arcade & Skill';
 };
 const getMode=title=>{
  const t=title.toLowerCase();
  if(/multiplayer|hide online|freefall tournament|slope multiplayer|tanks 3d online|sniper clash|military wars|masked shooters/.test(t))return 'online';
  if(/football legends|basketball legends|hockey legends|noughts and crosses|drunken archers duel|four colors|connect 4|ultimate tictactoe|foosball/.test(t))return 'local';
  return 'solo';
 };
 window.BigLWAY8EmbedCatalog=Object.freeze(rows.map(({title,rank,slug,image})=>{
  const mode=getMode(title);
  return Object.freeze({
   title,rank,slug,image,provider:'Y8',
   href:'https://www.y8.com/embed/'+slug,
   original:'https://www.y8.com/games/'+slug,
   launch:'embed',category:getCategory(title),
   multiplayerMode:mode,maybeMultiplayer:mode!=='solo',
   catalog:'y8-popular-embeddable',aspectRatio:'4/3'
  });
 }));
})();
