---
title: Clear CloudFlare Cache from VSTS
subtitle: Cache everything and purge it when releasing a new version from Visual Studio Team Services
collection: posts
date: 2017-04-16
template: post.html
tags:
 - powershell
 - vsts
 - cloudflare
---

Recently I created a website for a client, it was a static generated website, a promosite with only one page.

This gave me some nice opportunities for trying out some nice things. It's all generated with [gulp](https://gulpjs.com), much like this site - however it's optimized to be a single page.

It's code is in <abbr title="Visual Studio Team Services">VSTS</abbr>, and I set it up to build whenever we create a Pull Request.
This works very well, and in one week we did around 140 pull requests - with code reviews.

I found a bug that made it impossible to run Gulp 4 with the Gulp task, and created an [issue](https://github.com/Microsoft/vsts-tasks/issues/3890) on the bugtracker. To get around this I created a PowerShell that invokes the local gulp, and that fixed everything.

Releasing the site was done with <abbr title="Visual Studio Team Services">VSTS</abbr> as well. A small note to take here is due to everything being HTML, it's set to be cached on Cloudflare for the best performance - to clear this cache, you need to login to cloudflare and press a button or use their API.

I like automated things and created this script:

```powershell
$AUTH_USER = ''
$AUTH_TOKEN = ''
$ZONE_KEY = ''

$Headers = @{
	'X-Auth-Key'=$AUTH_TOKEN;
	'X-Auth-Email'=$AUTH_USER;
	'Content-Type'='application/json'
}
$Body = @{
	'purge_everything'=[boolean]'True'
} | ConvertTo-Json

Invoke-RestMethod https://api.cloudflare.com/client/v4/zones/$ZONE_KEY/purge_cache -Method DELETE -Headers $Headers -Body $Body -ContentType 'application/json'
```

On the [Cloudflare documentation](https://api.cloudflare.com/) there is an example using curl, but it all being windows I rewrote that in powershell, and it works just great.

This script clears everything, I could have extended it, to clear only the changed files from the release, but this seemed like overkill - taking everything into account.
