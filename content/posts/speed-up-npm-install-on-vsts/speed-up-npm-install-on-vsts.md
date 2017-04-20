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

This really bugged me, and I investigated it.   
It turns our I'm not the only one having this issue.

Now you could run your own build agent and cache all of the modules there, however if you are like me using Hosted agents, this is not an option.   

There are mumultipleltrple issues regarding this on the different platforms, like this one https://github.com/Microsoft/vsts-tasks/issues/553 on github.   
However the solutions mostly rely on you having an Agent yourself, or on Microsoft doing internal caching for their Hosted network.   

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
Until microsoft adds this, this is a great improvement.
