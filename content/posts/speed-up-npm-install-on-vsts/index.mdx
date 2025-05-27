---
title: Speed Up NPM INSTALL on Visual Studio Team Services
subtitle: Tired of your build times are mega slow due to npm?
collection: posts
date: 2017-04-20
template: post.html
tags:
 - VSTS
 - Yarn
 - NPM
---

My NPM build times were slow. The npm task alone were taking 75% of the totalt build time. I felt that this was too much so I investigated it a bit more.   
It turns out I'm not the only one having issues.


## Solution 1: Run your own build agent
Now you could run your own build agent and cache all of the modules there, however if you are like me using Hosted agents, this is not an option.   

## Solution 2: Wait for Microsoft to fix their things
There are multiple issues regarding this on the different platforms, like this one https://github.com/Microsoft/vsts-tasks/issues/553 on github.   
However the solutions mostly rely on you having an Agent yourself, or on Microsoft doing internal caching for their Hosted network.   

## Solution 3: Replace npm with Yarn on VSTS
But one things remains, and that's what I did [Install Yarn for VSTS](https://marketplace.visualstudio.com/items?itemName=geeklearningio.gl-vsts-tasks-yarn).   
This enables you to use [Yarn](https://yarnpkg.com/) instead of NPM, this should give some speed boosts.

Installing dependencies:

- NPM: 198 seconds
- YARN: 56 seconds

Full build:

- With NPM: 264 seconds
- With YARN: 112 seconds

This is a considerable speed up for my builds, and a very easy one as well.   
Just replace the `npm install` task on VSTS with `Yarn` and you are finished, nothing else needs to be done.

This will work for most projects, on other CI-servies, but some have already cached the modules making your builds faster.   
Until Microsoft adds this, this is a great improvement.
