function translate(json) {
  const varTags = Array.from(document.getElementsByTagName('var'));
  varTags.forEach((v, i) => {
    try {
      if (varTags[i].parentElement.childElementCount > 1) {
        varTags[i].textContent = new Function(
          'return this.' + varTags[i].textContent.toLowerCase() + ';'
        ).call(json);
      } else {
        varTags[i].parentElement.textContent = new Function(
          'return this.' + varTags[i].textContent.toLowerCase() + ';'
        ).call(json);
      }
    } catch (e) {
      varTags[i].textContent = '';
      console.warn('Error in <var/> Tag: ' + e.message);
    }
  });
}

$(document).ready(() => {
  $.get('/api/translations', ({ translations, locale }) => {
    document.documentElement.lang = locale;
    translate(translations);
  });
  $.get('/api/user', ({ user }) => {
    $('#usericon').attr('src', `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}`);
    $('#username').text(`${user.username}#${user.discriminator}`);
  });
  $.get('/api/user', (data) => {
    data.user.guilds.forEach((Guild) => {
      if (!Guild.hasPerms) {
        return;
      }
      $('#servers').append(`
<img class="server-${Guild.id}${
        Guild.inGuild ? '' : ' grayscale'
      }" onclick="window.location = '/servers/${Guild.id}'" width="60" height="60" src="${
        Guild.icon
          ? `https://cdn.discordapp.com/icons/${Guild.id}/${Guild.icon}.png`
          : 'https://i.imgur.com/fFReq20.png'
      }" alt="${Guild.name}">
`);
      $(`.server-${Guild.id}`).hover(() => {
        $('.server-name').text(Guild.name);
      });
    });
  });
});
