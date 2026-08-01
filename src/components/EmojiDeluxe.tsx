import React, { useState, useMemo } from 'react';
import { Search, Compass, Smile, Flame, Leaf, Utensils, Plane, Trophy, Lightbulb, ShieldAlert, Flag, Award } from 'lucide-react';

interface EmojiDeluxeProps {
  onSelect: (emoji: string) => void;
  onClose?: () => void;
}

// Map emojis to friendly descriptive names for display and superior searching
const EMOJI_NAME_MAP: Record<string, string> = {
  // Smileys & People
  '😀': 'Grinning Face',
  '😃': 'Grinning Face with Big Eyes',
  '😄': 'Grinning Face with Smiling Eyes',
  '😁': 'Beaming Face with Smiling Eyes',
  '😆': 'Grinning Squinting Face',
  '😅': 'Grinning Face with Sweat',
  '🤣': 'Rolling on the Floor Laughing',
  '😂': 'Face with Tears of Joy',
  '🙂': 'Slightly Smiling Face',
  '🙃': 'Upside-Down Face',
  '😉': 'Winking Face',
  '😊': 'Smiling Face with Smiling Eyes',
  '😇': 'Smiling Face with Halo',
  '🥰': 'Smiling Face with Hearts',
  '😍': 'Smiling Face with Heart-Eyes',
  '🤩': 'Star-Struck',
  '😘': 'Face Blowing a Kiss',
  '😗': 'Kissing Face',
  '😚': 'Kissing Face with Closed Eyes',
  '😙': 'Kissing Face with Smiling Eyes',
  '😋': 'Face Savoring Food',
  '😛': 'Face with Tongue',
  '😜': 'Winking Face with Tongue',
  '🤪': 'Zany Face',
  '😝': 'Squinting Face with Tongue',
  '🤑': 'Money-Mouth Face',
  '🤗': 'Hugging Face',
  '🤭': 'Face with Hand Over Mouth',
  '🤫': 'Shushing Face',
  '🤔': 'Thinking Face',
  '🤐': 'Zipper-Mouth Face',
  '🤨': 'Face with Raised Eyebrow',
  '😐': 'Neutral Face',
  '😑': 'Expressionless Face',
  '😶': 'Face Without Mouth',
  '😏': 'Smirking Face',
  '😒': 'Unamused Face',
  '🙄': 'Face with Rolling Eyes',
  '😬': 'Grimacing Face',
  '🤥': 'Lying Face',
  '😌': 'Relieved Face',
  '😔': 'Pensive Face',
  '😪': 'Sleepy Face',
  '🤤': 'Drooling Face',
  '😴': 'Sleeping Face',
  '😷': 'Face with Medical Mask',
  '🤒': 'Face with Thermometer',
  '🤕': 'Face with Head-Bandage',
  '🤢': 'Nauseated Face',
  '🤮': 'Face Vomiting',
  '🤧': 'Sneezing Face',
  '🥵': 'Hot Face',
  '🥶': 'Cold Face',
  '🥴': 'Woozy Face',
  '😵': 'Dizzy Face',
  '🤯': 'Exploding Head',
  '🤠': 'Cowboy Hat Face',
  '🥳': 'Partying Face',
  '😎': 'Smiling Face with Sunglasses',
  '🤓': 'Nerd Face',
  '🧐': 'Face with Monocle',
  '😕': 'Confused Face',
  '😟': 'Worried Face',
  '🙁': 'Slightly Frowning Face',
  '😮': 'Face with Open Mouth',
  '😯': 'Hushed Face',
  '😲': 'Astonished Face',
  '😳': 'Flushed Face',
  '🥺': 'Pleading Face',
  '😦': 'Frowning Face with Open Mouth',
  '😧': 'Anguished Face',
  '😨': 'Fearful Face',
  '😰': 'Anxious Face with Sweat',
  '😥': 'Sad but Relieved Face',
  '😢': 'Crying Face',
  '😭': 'Loudly Crying Face',
  '😱': 'Face Screaming in Fear',
  '😖': 'Confounded Face',
  '😣': 'Persevering Face',
  '😞': 'Disappointed Face',
  '😓': 'Downcast Face with Sweat',
  '😩': 'Weary Face',
  '😫': 'Tired Face',
  '🥱': 'Yawning Face',
  '😤': 'Face with Steam From Nose',
  '😡': 'Pouting Face',
  '😠': 'Angry Face',
  '🤬': 'Face with Symbols on Mouth',
  '💀': 'Skull',
  '☠️': 'Skull and Crossbones',
  '💩': 'Pile of Poop',
  '🤡': 'Clown Face',
  '👹': 'Ogre',
  '👺': 'Goblin',
  '👻': 'Ghost',
  '👽': 'Alien',
  '👾': 'Alien Monster',
  '🤖': 'Robot',
  '👋': 'Waving Hand',
  '🤚': 'Raised Back of Hand',
  '🖐️': 'Hand with Fingers Splayed',
  '✋': 'Raised Hand',
  '🖖': 'Vulcan Salute',
  '👌': 'OK Hand',
  '🤌': 'Pinched Fingers',
  '🤏': 'Pinching Hand',
  '✌️': 'Victory Hand',
  '🤞': 'Crossed Fingers',
  '🤟': 'Love-You Gesture',
  '🤘': 'Sign of the Horns',
  '🤙': 'Call Me Hand',
  '👈': 'Backhand Index Pointing Left',
  '👉': 'Backhand Index Pointing Right',
  '👆': 'Backhand Index Pointing Up',
  '🖕': 'Middle Finger',
  '👇': 'Backhand Index Pointing Down',
  '☝️': 'Index Pointing Up',
  '👍': 'Thumbs Up',
  '👎': 'Thumbs Down',
  '✊': 'Raised Fist',
  '👊': 'Oncoming Fist',
  '🤛': 'Left-Facing Fist',
  '🤜': 'Right-Facing Fist',
  '👏': 'Clapping Hands',
  '🙌': 'Raising Hands',
  '👐': 'Open Hands',
  '🤲': 'Palms Up Together',
  '🤝': 'Handshake',
  '🙏': 'Folded Hands/Please',
  // Animals & Nature
  '🐶': 'Dog',
  '🐱': 'Cat',
  '🐭': 'Mouse',
  '🐹': 'Hamster',
  '🐰': 'Rabbit',
  '🦊': 'Fox',
  '🐻': 'Bear',
  '🐼': 'Panda',
  '🐨': 'Koala',
  '🐯': 'Tiger',
  '🦁': 'Lion',
  '🐮': 'Cow Face',
  '🐷': 'Pig',
  '🐽': 'Pig Nose',
  '🐸': 'Frog',
  '🐵': 'Monkey Face',
  '🙈': 'See-No-Evil Monkey',
  '🙉': 'Hear-No-Evil Monkey',
  '🙊': 'Speak-No-Evil Monkey',
  '🐒': 'Monkey',
  '🐔': 'Chicken',
  '🐧': 'Penguin',
  '🐦': 'Bird',
  '🐤': 'Baby Chick',
  '🐣': 'Hatching Chick',
  '🐥': 'Baby Chick Front',
  '🦆': 'Duck',
  '🦅': 'Eagle',
  '🦉': 'Owl',
  '🦇': 'Bat',
  '🐺': 'Wolf',
  '🐗': 'Boar',
  '🐴': 'Horse',
  '🦄': 'Unicorn',
  '🐝': 'Honeybee',
  '🪱': 'Worm',
  '🐛': 'Bug',
  '🦋': 'Butterfly',
  '🐌': 'Snail',
  '🐞': 'Lady Bug',
  '🐜': 'Ant',
  '🪰': 'Fly',
  '🪲': 'Beetle',
  '🪳': 'Cockroach',
  ' Mosquito': 'Mosquito',
  '🦗': 'Cricket',
  '🕷️': 'Spider',
  '🕸️': 'Spider Web',
  '🦂': 'Scorpion',
  '🐢': 'Turtle',
  '🐍': 'Snake',
  '🦎': 'Lizard',
  'octopus': 'Octopus',
  '🐙': 'Octopus',
  '🦑': 'Squid',
  '🦪': 'Oyster',
  'lobster': 'Lobster',
  '🦀': 'Crab',
  '🐡': 'Blowfish',
  '🐠': 'Tropical Fish',
  '🐟': 'Fish',
  '🐬': 'Dolphin',
  '🐳': 'Spouting Whale',
  '🐋': 'Whale',
  '🦈': 'Shark',
  '🐊': 'Crocodile',
  '🐅': 'Tiger',
  '🐆': 'Leopard',
  'zebra': 'Zebra',
  '🦍': 'Gorilla',
  '🦧': 'Orangutan',
  '🦣': 'Mammoth',
  'Elephant': 'Elephant',
  '🐘': 'Elephant',
  '🦛': 'Hippopotamus',
  '🦏': 'Rhinoceros',
  '🦘': 'Kangaroo',
  '🦬': 'Bison',
  '🐃': 'Buffalo',
  '🐂': 'Ox',
  '🐄': 'Cow',
  '🐎': 'Horse',
  '🐖': 'Pig',
  '🐏': 'Ram',
  '🐑': 'Sheep',
  '🐐': 'Goat',
  '🦌': 'Deer',
  '🐕': 'Dog',
  '🐩': 'Poodle',
  '🐈': 'Cat',
  '🐈‍⬛': 'Black Cat',
  '🪶': 'Feather',
  'swan': 'Swan',
  '🦤': 'Dodo',
  '🦩': 'Flamingo',
  '🦚': 'Peacock',
  '🌴': 'Palm Tree',
  '🌳': 'Deciduous Tree',
  '🌲': 'Evergreen Tree',
  '🌱': 'Seedling',
  '🌿': 'Herb',
  '☘️': 'Shamrock',
  '🍀': 'Four Leaf Clover',
  '🍁': 'Maple Leaf',
  '🍂': 'Fallen Leaf',
  '🍃': 'Leaf Fluttering in Wind',
  '🍄': 'Mushroom',
  '🐚': 'Spiral Shell',
  // Food & Drink
  '🍏': 'Green Apple',
  '🍎': 'Red Apple',
  '🍐': 'Pear',
  '🍊': 'Tangerine',
  '🍋': 'Lemon',
  '🍌': 'Banana',
  '🍉': 'Watermelon',
  '🍈': 'Melon',
  '🍇': 'Grapes',
  '🍓': 'Strawberry',
  '🫐': 'Blueberries',
  '🍒': 'Cherries',
  '🍑': 'Peach',
  '🥭': 'Mango',
  '🍍': 'Pineapple',
  '🥥': 'Coconut',
  '🥝': 'Kiwi Fruit',
  '🍅': 'Tomato',
  '🍆': 'Eggplant',
  '🥑': 'Avocado',
  ' Broccoli': 'Broccoli',
  '🥦': 'Broccoli',
  '🥬': 'Leafy Green',
  '🥒': 'Cucumber',
  '🌶️': 'Hot Pepper',
  '🫑': 'Bell Pepper',
  '🌽': 'Ear of Corn',
  '🥕': 'Carrot',
  '🫒': 'Olive',
  '🥔': 'Potato',
  '🍠': 'Roasted Sweet Potato',
  '🥐': 'Croissant',
  '🥯': 'Bagel',
  '🍞': 'Bread',
  '🥖': 'Baguette Bread',
  '🥨': 'Pretzel',
  '🧀': 'Cheese Wedge',
  '🥚': 'Egg',
  '🍳': 'Cooking',
  'バター': 'Butter',
  '🧈': 'Butter',
  '🥞': 'Pancakes',
  '🧇': 'Waffle',
  '🥓': 'Bacon',
  '🥩': 'Cut of Meat',
  '🍗': 'Poultry Leg',
  '🍖': 'Meat on Bone',
  '🍔': 'Hamburger',
  '🍟': 'French Fries',
  '🍕': 'Pizza',
  '🌭': 'Hot Dog',
  '🥪': 'Sandwich',
  '🌮': 'Taco',
  '🌯': 'Burrito',
  '🫓': 'Flatbread',
  '🥙': 'Stuffed Flatbread',
  '🧆': 'Falafel',
  '🥘': 'Shallow Pan of Food',
  '🍲': 'Pot of Food',
  '🫕': 'Fondue',
  '🥣': 'Bowl with Spoon',
  '🥗': 'Green Salad',
  '🍿': 'Popcorn',
  '🧂': 'Salt',
  '🥫': 'Canned Food',
  '🍱': 'Bento Box',
  '🍘': 'Rice Cracker',
  '🍙': 'Rice Ball',
  '🍚': 'Cooked Rice',
  '🍛': 'Curry Rice',
  '🍜': 'Steaming Bowl',
  '🍝': 'Spaghetti',
  '🍢': 'Oden',
  '🍣': 'Sushi',
  '🍤': 'Fried Shrimp',
  '🍥': 'Fish Cake with Swirl',
  '🍡': 'Dango',
  '🥟': 'Dumpling',
  '🥠': 'Fortune Cookie',
  '🥡': 'Takeout Box',
  '🍨': 'Ice Cream',
  '🍧': 'Shaved Ice',
  '🍦': 'Soft Ice Cream',
  '🍩': 'Donut',
  '🍪': 'Cookie',
  '🎂': 'Birthday Cake',
  '🍰': 'Shortcake',
  '🧁': 'Cupcake',
  '🥧': 'Pie',
  '🍫': 'Chocolate Bar',
  '🍬': 'Candy',
  '🍭': 'Lollipop',
  '🍮': 'Custard',
  '🍯': 'Honey Pot',
  '🍼': 'Baby Bottle',
  '🥛': 'Glass of Milk',
  '☕': 'Hot Beverage',
  '🫖': 'Teapot',
  '🍵': 'Teacup Without Handle',
  '🍶': 'Sake',
  '🍾': 'Bottle with Popping Cork',
  '🍷': 'Wine Glass',
  '🍸': 'Cocktail Glass',
  '🍹': 'Tropical Drink',
  '🍺': 'Beer Mug',
  '🍻': 'Clinking Beer Mugs',
  '🥂': 'Clinking Glasses',
  '🥃': 'Tumbler Glass',
  '🥤': 'Cup with Straw',
  '🧃': 'Beverage Box',
  '🧉': 'Mate',
  '🧊': 'Ice',
  // Travel & Places
  '🚗': 'Car',
  '🚕': 'Taxi',
  '🚙': 'SUV',
  '🚌': 'Bus',
  '🚎': 'Trolleybus',
  '🏎️': 'Racing Car',
  '🚓': 'Police Car',
  '🚑': 'Ambulance',
  '🚒': 'Fire Engine',
  '🚐': 'Minibus',
  '🛻': 'Pickup Truck',
  '🚚': 'Delivery Truck',
  '🚛': 'Articulated Lorry',
  '🚜': 'Tractor',
  '🛵': 'Motor Scooter',
  '🏍️': 'Motorcycle',
  '🛺': 'Auto Rickshaw',
  '🚲': 'Bicycle',
  '🛴': 'Kick Scooter',
  '🛹': 'Skateboard',
  '🚏': 'Bus Stop',
  '🛣️': 'Motorway',
  '🛤️': 'Railway Track',
  '⛽': 'Fuel Pump',
  '🚨': 'Siren Emergency',
  '🛳️': 'Passenger Ship',
  '⛵': 'Sailboat',
  '🚤': 'Speedboat',
  '⛴️': 'Ferry',
  '🚢': 'Ship',
  '✈️': 'Airplane',
  '🛫': 'Airplane Departure',
  '🛬': 'Airplane Arrival',
  '🪂': 'Parachute',
  '🚁': 'Helicopter',
  '🚟': 'Suspension Railway',
  '🚠': 'Mountain Cableway',
  '🚀': 'Rocket',
  '🛸': 'Flying Saucer',
  '🪐': 'Ringed Planet',
  '💫': 'Dizzy symbol',
  '⭐': 'Star',
  '☄️': 'Comet',
  '🔥': 'Fire',
  '🌍': 'Globe Europe-Africa',
  '🌎': 'Globe Americas',
  '🗺️': 'World Map',
  '🏔️': 'Snow-Capped Mountain',
  '🗻': 'Mount Fuji',
  '🏜️': 'Desert',
  '🌋': 'Volcano',
  '⛺': 'Tent',
  '🏠': 'House',
  '🏡': 'House with Garden',
  '🏢': 'Office Building',
  '🏣': 'Japanese Post Office',
  '🏤': 'Post Office',
  '🏥': 'Hospital',
  // Activities
  '⚽': 'Soccer',
  '🏀': 'Basketball',
  '🏈': 'Football',
  '⚾': 'Baseball',
  '🥎': 'Softball',
  '🎾': 'Tennis',
  '🏐': 'Volleyball',
  '🏉': 'Rugby',
  '🥏': 'Flying Disc',
  '🎱': 'Pool 8 Ball',
  '🪀': 'Yo-Yo',
  '🏓': 'Table Tennis',
  '🏸': 'Badminton',
  '🏒': 'Ice Hockey',
  '🏑': 'Field Hockey',
  '🥍': 'Lacrosse',
  '🏹': 'Bow and Arrow',
  '🎣': 'Fishing',
  '🤿': 'Diving Mask',
  '🥊': 'Boxing Glove',
  '🥋': 'Martial Arts Uniform',
  '🛼': 'Roller Skate',
  '🛷': 'Sled',
  '🥌': 'Curling Stone',
  '🎿': 'Skis',
  '🏂': 'Snowboarder',
  '🏋️': 'Weightlifter',
  ' fencing': 'Fencing',
  '🤺': 'Fencer',
  '🤼': 'Wrestlers',
  '🤸': 'Cartwheel',
  '🩰': 'Ballet Shoes',
  '⛹️': 'Person Bouncing Ball',
  '🏌️': 'Golfer',
  // Objects & Tools
  '💡': 'Light Bulb',
  '👑': 'Gold Crown',
  '🎒': 'Backpack',
  '✅': 'Green Checkbox',
  '🦕': 'Dinosaur Nessie',
  '🎉': 'Tada Popper',
};

// Full comprehensive dataset mapping the visual categories in the image
const EMOJI_CATEGORIES = [
  { id: 'all', label: 'All', icon: Compass },
  { id: 'smileys', label: 'Smileys & People', icon: Smile, emojis: [
    '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '😕', '😟', '🙁', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖', '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏'
  ]},
  { id: 'nature', label: 'Animals & Nature', icon: Leaf, emojis: [
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🪱', '🐛', '🦋', '🐌', '🐞', '🐜', '🪰', '🪲', '🪳', '🦟', '🦗', '🕷️', '🕸️', '🦂', '🐢', '🐍', '🦎', '🐙', '🦑', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🦣', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🦬', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🐐', '🦌', '🐕', '🐩', '🐈', '🐈‍⬛', '🪶', '🦅', '🦆', '🦢', '🦉', '🦤', '🦩', '🦚', '🌴', '🌳', '🌲', '🌱', '🌿', '☘️', '🍀', '🍁', '🍂', '🍃', '🍄', '🐚'
  ]},
  { id: 'food', label: 'Food & Drink', icon: Utensils, emojis: [
    '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍈', '🍇', '🍓', '🫐', '🍉', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🍔', '🍟', '🍕', '🌭', '🥪', '🌮', '🌯', '🫓', '🥙', '🧆', '🍳', '🥘', '🍲', '🫕', '🥣', '🥗', '🍿', '🧈', '🧂', '🥫', '🍱', '🍘', '🍙', '🍚', '🍛', '🍜', '🍝', '🍠', '🍢', '🍣', '🍤', '🍥', '🍡', '🥟', '🥠', '🥡', '🦀', '🦞', '🍤', '🦑', '🦪', '🍨', '🍧', '🍦', '🍩', '🍪', '🎂', '🍰', '🧁', '🥧', '🍫', '🍬', '🍭', '🍮', '🍯', '🍼', '🥛', '☕', '🫖', '🍵', '🍶', '🍾', '🍷', '🍸', '🍹', '🍺', '🍻', '🥂', '🥃', '🥤', '🧃', '🧉', '🧊'
  ]},
  { id: 'travel', label: 'Travel & Places', icon: Plane, emojis: [
    '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🛵', '🏍️', '🛺', '🚲', '🛴', '🛹', '🚏', '🛣️', '🛤️', '⛽', '🚨', '🛳️', '⛵', '🚤', '⛴️', '🚢', '✈️', '🛫', '🛬', '🪂', '🚁', '🚟', '🚠', '🚀', '🛸', '🪐', '💫', '⭐', '☄️', '🔥', '🌍', '🌎', '🗺️', '🏔️', '🗻', '🏜️', '🌋', '⛺', '🏠', '🏡', '🏢', '🏣', '🏤', '🏥'
  ]},
  { id: 'activity', label: 'Activity', icon: Trophy, emojis: [
    '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏹', '🎣', '🤿', '🥊', '🥋', '🛹', '🛼', '🛷', '🥌', '🎿', '🏂', '🪂', '🏋️', '🤺', '🤼', '🤸', '🩰', '⛹️', '🏌️'
  ]},
  { id: 'objects', label: 'Objects & Tools', icon: Lightbulb, emojis: [
    '💡', '🔦', '🕯️', '🪔', '👑', '👒', '👓', '🕶️', '🥽', '🥼', '🦺', '👔', '👕', '👖', '🧣', '🧤', '🧥', '🧦', '👗', '👘', '🥻', '🩱', '🩲', '🩳', '👙', '👚', '👛', '👜', '👝', '🎒', '🛅', '👟', '🥾', '🥿', '👠', '👡', '👢', '🔋', '🔌', '💻', '🖥️', '🖨️', '⌨️', '🖱️', '🎛️', '🎞️', '📽️', '📺', '📷', '📹', '⏳', '⏰', '⌚', '🎈', '🪄', '🧿', '💶', '💵', '💷', '🪙', '💸', '💳', '🧾', '✉️', '📦', '✏️', '✒️', '📝', '📁', '📂', '📅', '🗑️', '🔒', '🔓', '🔑', '🔨', '🛠️', '⚙️', '🧱', '🛡️', '⚔️', '🔮', '🩺', '💊', '🪓', '🚿', '🛀', '🧼', '🧹'
  ]},
  { id: 'symbols', label: 'Symbols', icon: ShieldAlert, emojis: [
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '⚧️', '☯️', '☦️', '🛐', '⛎', '🔮', '🧿', '📿', '♻️', '♻', '❇️', '⚠️', '🚸', '⛔', '🚫', '🚳', '🚭', '🚯', '🚱', '🚷', '📵', '🔞', '☣️', '☣', '☢️', '🔄', '🔃', '🔀', '🔁', '🔂', '▶️', '⏩', '◀️', '⏪', '🔼', '🔽', '🔢', '🔣', 'ℹ️', '🔡', '🔠', '🆗', '🆙', '🆓', '🆖', '🆕', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '♦️', '♣️', '🎴', '🔔', '📢', '💬', '💭', '🗯️', '✔️', '☑️', '✅', '❌', '❎', '➕', '➖', '➗', '🟰', '❓', '❔', '❕', '❗', '💯', '🔅', '📳', '👁️‍🗨️'
  ]},
  { id: 'flags', label: 'Flags', icon: Flag, emojis: [
    '🏁', '🚩', '🎌', '🏴', '🏳️', '🏳️‍🌈', '🏳️‍⚧️', '🇺🇸', '🇬🇧', '🇨🇦', '🇪🇬', '🇩🇪', '🇫🇷', '🇯🇵', '🇨🇳', '🇮🇹', '🇧🇷', '🇷🇺', '🇮🇳', '🇿🇦', '🇰🇷', '🇪🇸', '🇦🇺', '🇲🇽', '🇸🇦', '🇦🇪', '🇹🇷'
  ]},
  { id: 'exclusive', label: 'Custom Deluxe', icon: Award, emojis: [
    '👍', '❤️', '😂', '😮', '😢', '🙏', '🎉', '🔥', '👏', '🚀', '🦕', '✅', '🐶', '🤣', '👀', '🐒', '💃', '❗️', '🐏', '💸', '😭', '🍜', '🚨', '👋'
  ]}
];

// Flat list for searches
const ALL_EMOJIS_FLAT = EMOJI_CATEGORIES.flatMap(cat => 
  (cat.emojis || []).map(emoji => ({
    emoji,
    category: cat.id,
    label: cat.label
  }))
);

// High-fidelity replica of the frequently used drawer 
const FREQUENTLY_USED_REPLICA = [
  { emoji: '👍', label: 'Thumbs Up' },
  { emoji: '😆', label: 'Squinting Laughing' },
  { emoji: '😂', label: 'Tears of Joy' },
  { emoji: '👀', label: 'Looking Eyes' },
  { emoji: '🦕', label: 'Dinosaur' },
  { emoji: '✅', label: 'Green Checkbox' },
  { emoji: '🐶', label: 'Doggy' },
  { emoji: '🤣', label: 'ROFL' },
  { emoji: '😱', label: 'Screaming In Fear' },
  { emoji: '😊', label: 'Smiling Eyes' },
  { emoji: '🙏', label: 'Praying Hands' },
  { emoji: '🥲', label: 'Smiling with Tear' },
  { emoji: '🙄', label: 'Rolling Eyes' },
  { emoji: '🤯', label: 'Exploding Head' },
  { emoji: '🙌', label: 'Hands Raised' },
  { emoji: '🚨', label: 'Red Siren' },
  { emoji: '🐏', label: 'Ram Sheep' },
  { emoji: '🤔', label: 'Thinking Face' },
  { emoji: '🤍', label: 'White Heart' },
  { emoji: '🎉', label: 'Tada Popper' },
  { emoji: '💃', label: 'Dancing Queen' },
  { emoji: '❗', label: 'Exclamation' },
  { emoji: '❤️', label: 'Red Heart' },
  { emoji: '🐒', label: 'Cute Monkey' },
  { emoji: '💸', label: 'Flying Cash' },
  { emoji: '😭', label: 'Loud Crying' },
  { emoji: '🍜', label: 'Ramen Soup' },
  { emoji: '👋', label: 'Wave Hand' }
];

export function EmojiDeluxe({ onSelect, onClose }: EmojiDeluxeProps) {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hoveredEmoji, setHoveredEmoji] = useState<string | null>(null);

  // Filter emojis based on active tab and search query
  const filteredEmojis = useMemo(() => {
    let base = ALL_EMOJIS_FLAT;

    // Filter by tab
    if (activeTab !== 'all') {
      base = base.filter(item => item.category === activeTab);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      base = base.filter(item => {
        const name = EMOJI_NAME_MAP[item.emoji]?.toLowerCase() || '';
        return (
          item.emoji.includes(q) || 
          item.label.toLowerCase().includes(q) ||
          name.includes(q)
        );
      });
    }

    // Deduplicate mapping
    const uniqueMap = new Map<string, typeof base[0]>();
    base.forEach(item => uniqueMap.set(item.emoji, item));
    return Array.from(uniqueMap.values());
  }, [activeTab, searchQuery]);

  // Grouped render when in "all" view
  const categoryGroups = useMemo(() => {
    return EMOJI_CATEGORIES.filter(cat => cat.id !== 'all');
  }, []);

  return (
    <div 
      id="emoji-deluxe-picker"
      className="w-[360px] max-w-[95vw] h-[450px] bg-[#1A1D21] border border-[#2A2B2F] rounded-2xl shadow-2xl flex flex-col overflow-hidden relative font-sans text-gray-200 z-[999]"
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. Category Tabs Header */}
      <div className="flex items-center justify-between px-3 pt-2 pb-1 border-b border-[#2A2B2F] bg-[#121317] shrink-0 min-w-0">
        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar scrollbar-none flex-1 min-w-0 py-1 pr-2">
          {EMOJI_CATEGORIES.map((cat) => {
            const IconComponent = cat.icon;
            const isActive = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveTab(cat.id);
                  setSearchQuery('');
                }}
                title={cat.label}
                className={`p-2 rounded-lg transition-all shrink-0 relative flex items-center justify-center ${
                  isActive 
                    ? 'text-white bg-blue-600/20 border border-blue-500/40' 
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                }`}
              >
                <IconComponent className="h-4 w-4" />
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                )}
              </button>
            );
          })}
        </div>

        {onClose && (
          <button 
            type="button"
            onClick={onClose}
            className="p-1 px-2 text-xs font-mono text-gray-400 hover:text-white hover:bg-gray-800 rounded transition shrink-0 ml-2 cursor-pointer"
          >
            Esc
          </button>
        )}
      </div>

      {/* 2. Search Box input */}
      <div className="p-3 bg-[#121317] border-b border-[#2A2B2F] shrink-0">
        <div className="relative">
          <input
            type="text"
            placeholder="Search all emojis"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1A1D21] text-gray-200 border border-[#2A2B2F] focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 rounded-lg px-3 py-2 pl-9 text-xs transition placeholder-gray-500 focus:outline-none"
            autoFocus
          />
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-500" />
        </div>
      </div>

      {/* 3. Main Scrolling Area */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4 custom-scrollbar bg-[#1A1D21]">
        
        {/* Dynamic / Search View */}
        {searchQuery.trim() ? (
          <div>
            <h4 className="text-[10px] font-bold tracking-wider text-gray-400 uppercase mb-2">
              Search Results ({filteredEmojis.length})
            </h4>
            {filteredEmojis.length > 0 ? (
              <div className="grid grid-cols-8 gap-1.5">
                {filteredEmojis.map((item) => (
                  <button
                    type="button"
                    key={item.emoji}
                    onClick={() => onSelect(item.emoji)}
                    onMouseEnter={() => setHoveredEmoji(item.emoji)}
                    onMouseLeave={() => setHoveredEmoji(null)}
                    className="p-1.5 text-xl hover:bg-gray-800 rounded-lg transition transform hover:scale-125 duration-100 flex items-center justify-center select-none cursor-pointer"
                  >
                    {item.emoji}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-center text-gray-500 py-6">No matching emoji found 😢</p>
            )}
          </div>
        ) : (
          /* Normal Category Layout */
          <>
            {/* Frequently used Drawer */}
            {activeTab === 'all' && (
              <div>
                <h4 className="text-[11px] font-bold tracking-wider text-gray-400 font-sans uppercase mb-2 flex items-center justify-between">
                  <span>Frequently Used</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                </h4>
                <div className="grid grid-cols-8 gap-1.5">
                  {FREQUENTLY_USED_REPLICA.map((item, id) => (
                    <button
                      type="button"
                      key={`${item.emoji}-${id}`}
                      onClick={() => onSelect(item.emoji)}
                      onMouseEnter={() => setHoveredEmoji(item.emoji)}
                      onMouseLeave={() => setHoveredEmoji(null)}
                      title={item.label}
                      className="p-1.5 text-xl hover:bg-gray-800 rounded-lg transition transform hover:scale-120 flex items-center justify-center select-none bg-gray-900/10 hover:shadow-inner cursor-pointer"
                    >
                      {item.emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* If Specific Tab is Active OR "all" Scrolling through grouped components */}
            {activeTab === 'all' ? (
              categoryGroups.map((cat) => (
                <div key={cat.id} className="pt-2">
                  <h4 className="text-[11px] font-bold tracking-wider text-gray-400 font-sans uppercase mb-2">
                    {cat.label}
                  </h4>
                  <div className="grid grid-cols-8 gap-1.5">
                    {(Array.from(new Set(cat.emojis || [])) as string[]).slice(0, 40).map((emoji) => (
                      <button
                        type="button"
                        key={emoji}
                        onClick={() => onSelect(emoji)}
                        onMouseEnter={() => setHoveredEmoji(emoji)}
                        onMouseLeave={() => setHoveredEmoji(null)}
                        className="p-1.5 text-xl hover:bg-gray-800 rounded-lg transition transform hover:scale-120 flex items-center justify-center select-none cursor-pointer"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              /* Specific tab displays entire directory list */
              <div>
                <h4 className="text-[11px] font-bold tracking-wider text-gray-400 font-sans uppercase mb-2">
                  {EMOJI_CATEGORIES.find(c => c.id === activeTab)?.label}
                </h4>
                <div className="grid grid-cols-8 gap-1.5">
                  {filteredEmojis.map((item) => (
                    <button
                      type="button"
                      key={item.emoji}
                      onClick={() => onSelect(item.emoji)}
                      onMouseEnter={() => setHoveredEmoji(item.emoji)}
                      onMouseLeave={() => setHoveredEmoji(null)}
                      className="p-1.5 text-xl hover:bg-gray-800 rounded-lg transition transform hover:scale-120 flex items-center justify-center select-none cursor-pointer"
                    >
                      {item.emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 4. Footer Panel */}
      <div className="h-12 border-t border-[#2A2B2F] bg-[#121317] px-4 flex items-center justify-between shrink-0 select-none">
        {hoveredEmoji ? (
          <div className="flex items-center gap-2">
            <span className="text-2xl transition-transform transform scale-110 duration-150">{hoveredEmoji}</span>
            <span className="text-xs font-semibold text-gray-300 capitalize">
              {EMOJI_NAME_MAP[hoveredEmoji] || 'Emoji'}
            </span>
          </div>
        ) : (
          <span className="text-xs text-gray-500">
            Select an emoji to react or reply
          </span>
        )}
      </div>
    </div>
  );
}
