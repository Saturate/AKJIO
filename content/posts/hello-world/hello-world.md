---
title: Hello World
subtitle: Just another blog? Or something more?
collection: posts
date: 2016-04-12
updated:  2016-04-12
template: post.html
---

This is my new blog that I have had intentions of making, the last many years. A wise man once said

> ‘Finished last’ will always be better than ‘Did not finish’, which always trumps ‘Did not start.’

<!-- more -->

I installed WordPress, MySQL, PHP and then never really got anywhere after that.

It was time to try something new. Now I have the great pleasure, of launching my site unfinished. Keep on reading if you want the details.

## But, why even make a blog?

It seems a bit like JavaScript frameworks. Everybody and their dog's has one of their own.

I intend to make my blog a little different. I want to update each article when the time is fit, little more like a wiki than a blog. I realize that this can be hard, and therefore I also Open Sourced my blog.   
It's all on GitHub and people are free to make pull-requests to update or add missing information.

### But that does not really answer my question...

Okay I want a place to document my front-end findings, while I practice the **art** of writing.
All feedback and blog ideas are welcome.

## How It's Made

It's made using Gulp, Nunjucks, NodeJS and Water. All hosted on GitHub.

All posts and pages are just plain markdown files that gets converted to HTML on build. This is also called a [Static Generated Site](https://davidwalsh.name/introduction-static-site-generators), you can do it with Jekyll. I really like Jekyll, and took a lot of their ideas but did it all in JavaScript. Why not use metalsmith? It did not fit my needs, I wanted it to be compliant with the gulp ecosystem... this lead me to create [gulp-water](https://github.com/Saturate/gulp-water), naming it gulp-water is a misstep, as it works for all things node, it's just using steams... Maybe one day I will rename it.

I'll cover the pros and cons of a static generated site in a later post.

## The Future

I'll continue to work on the site, make a design and implement some nice, but missing features. I'm already considering shifting out Nunjucks for (p)react, to do some nice page transitions and client rendering.
