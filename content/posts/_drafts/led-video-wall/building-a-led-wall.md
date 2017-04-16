---
title: Building an interactive LED WALL
subtitle: Hardware hacking and software adventures.
collection: posts
date:
template: post.html
---

I work for Pentia, and one of the things that make it a great place to work is that we are allowed to play around.
They sponsored everything, and I used my own time. So shout out to them for letting me play around.

## Getting Started

We talked about office decorations, and we somehow came to a conclusion that building a giant interactive LED wall would be a good idea.
Pretty quickly we pitched the idea to management and got the greenlight to build a prototype.

## Building the prototype

We found a pretty awesome LED cube on adafruit.com, it had a guide and part list, pretty much everything - awesome!
We ordered everything we needed and got some extra stuff from adafruit.

### Power
Everything runs on 5v current, and just buying everything would be bad as we like to hack around. I got the idea that we could repurpose an old ATX powersupply from an old workstation.

It's pretty easy to get out... normally but this was some custom dell thingy. We succeeded but only after my Coworker Mads had an incedent with some evil chip that cut he's finger. RIP.
To jump a power supply is an easy task, just connect the green wire to a black one. You might need a more detailed guide, I'm sure google can help you there!
Connecting the rest turned out to be easier than I was thinking at first, the cards support MOLEX. I found a MOLEX cable and removed the 12v wires, just to be sure. NOTE: SOMETHING ABOUT THE STRANGE MOLEX COLORS.

The LED panels is connected to the receiver card, only hard thing here was finding the + and -, as it's not clearly

Everything turned on. But nothing worked, the LED panels was flickering in a really strange pattern

![T-Nuts 2020](/images/tnuts2020.jpg)
