# Oxford Motorsport Society website

Live at **https://www.oxmotorsport.uk**. Hosted free on GitHub Pages from this repository.

## Updating the site (no coding needed)

1. Go to **https://app.pagescms.org** and sign in. Use the society GitHub account, or the email address a committee member invited.
2. Open this repository. The sidebar has:
   - **Committee**: Executive and General Committee names, roles and photos
   - **Term cards & events**: add a new term each term with its 4:5 term card; older terms move to the archive automatically
   - **Governance documents**: upload or replace PDFs
   - **Photos**: the photo strip on the home page
   - **Sponsors**: sponsor logos, the sponsorship pitch and an optional sponsorship pack PDF
   - **Store**: tickets and merch, each linked to a Stripe Payment Link. The Store link appears in the menu once an item isn't Hidden
   - **Site settings**: price, Stripe membership link, home page background photo, feedback form link
3. Click **Save**. The live site updates within a minute or two. If it hasn't, refresh the page.

## Handover each year

- In Pages CMS → **Settings → Collaborators**, invite the new committee by email and remove people who have left.
- Pass on the society Gmail, GitHub, Stripe and IONOS logins to the new Secretary or President.

## How it works (for whoever maintains it)

- Plain HTML and CSS, with no build step. `site.js` loads `content/*.json` and fills in each page. Each page's `<body data-content="...">` lists the files it needs.
- `.pages.yml` defines the admin forms. Uploads go to `media/images` and `media/documents`.
- To preview locally, run `python3 -m http.server` in this folder and open http://localhost:8000. Opening the HTML files directly won't load the content.
- `CNAME` holds the custom domain for GitHub Pages. DNS is managed at IONOS.
