/** Select the public homepage only after the team has voted.
 * During comparison keep "chooser". Other values: "city" or "paper".
 * Preview routes remain accessible regardless of this setting.
 */
export const siteSettings = {
  homepageDesign: 'chooser' as 'chooser' | 'city' | 'paper',
  brand: {
    logoImage: '', // example: '/brand/newzgen.svg' after adding it to public/brand
    name: 'newZgen',
    tagline: 'The news behind the news.'
  }
};
