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

/**
 * Add Song to Queue
 * @param {string} song Song Name
 * @param {string} mchannel Text Channel ID
 * @param {string} vchannel Voice Channel ID
 */
function addSongToQueue(song, mchannel, vchannel) {
  if (mchannel && vchannel) {
    return fetch(
      `/api/queue/${window.location.pathname.split('/')[2]}/add/${encodeURIComponent(
        song
      )}?mchannel=${mchannel}&vchannel=${vchannel}`,
      {
        method: 'POST'
      }
    );
  } else {
    return fetch(
      `/api/queue/${window.location.pathname.split('/')[2]}/add/${encodeURIComponent(song)}`,
      {
        method: 'POST'
      }
    );
  }
}

$(document).ready(() => {
  $('#changeprefixsubmit').on('click', null, null, () => {
    fetch(`/api/prefix/${window.location.pathname.split('/')[2]}/${$('#newprefix').val()}`, {
      method: 'POST'
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`${res.statusText}`);
        } else {
          $('#changePrefix').modal('toggle');
        }
      })
      .catch((err) => {
        console.error(err.message || err);
        $('#prefixmodalerror').text(err.message || err);
      });
  });
  $('#openaddsongstoqueuemodal').on('click', null, null, async () => {
    const GuildID = window.location.pathname.split('/')[2];
    const channels = await (await fetch(`/api/channels/${GuildID}`)).json();
    $('#selectmchannel').empty();
    $('#selectvchannel').empty();
    $.each(channels.textChannels, (i, v) => {
      $('#selectmchannel').append(
        $('<option>', {
          value: v.id,
          text: v.name
        })
      );
    });
    $.each(channels.voiceChannels, (i, v) => {
      $('#selectvchannel').append(
        v.id == channels.currentVoiceChannel.id
          ? $('<option>', {
              value: v.id,
              text: v.name,
              selected: true
            })
          : $('<option>', {
              value: v.id,
              text: v.name
            })
      );
    });
    $('#addSongWithoutQueue').modal('toggle');
  });
  $('#addsongsubmit').on('click', null, null, () => {
    $('#songmodalerror').text('🔍 Searching...');
    addSongToQueue($('#addSongSong').val())
      .then((res) => {
        if (!res.ok) {
          throw new Error(`${res.statusText}`);
        } else {
          $('#addSong').modal('toggle');
          $('#songmodalerror').text('');
        }
      })
      .catch((err) => {
        console.error(err.message || err);
        $('#songmodalerror').text(err.message || err);
      });
  });
  $('#addsongwithoutqueuesubmit').on('click', null, null, () => {
    $('#songqueuemodalerror').text('🔍 Searching...');
    addSongToQueue(
      $('#addSongSongWithoutQueue').val(),
      $('#selectmchannel').val(),
      $('#selectvchannel').val()
    )
      .then((res) => {
        if (!res.ok) {
          throw new Error(`${res.statusText}`);
        } else {
          $('#addSongWithoutQueue').modal('toggle');
          $('#songqueuemodalerror').text('');
        }
      })
      .catch((err) => {
        console.error(err.message || err);
        $('#songqueuemodalerror').text(err.message || err);
      });
  });
  $('#skipsong').on('click', null, null, () => {
    fetch(`/api/queue/${window.location.pathname.split('/')[2]}/skip`, {
      method: 'POST'
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`${res.statusText}`);
        } else {
          res.json().then((json) => {
            $('#customToastBody').text(`${json.status} Song`);
            $('#customToast').toast('show');
          });
        }
      })
      .catch((err) => {
        console.error(err.message || err);
      });
  });
  let translation = {};
  $.get('/api/translations', ({ translations, locale }) => {
    document.documentElement.lang = locale;
    translation = translations;
    translate(translations);
  });
  $.get('/api/user', (data) => {
    // User Menu
    $('#usericon').attr(
      'src',
      `https://cdn.discordapp.com/avatars/${data.user.id}/${data.user.avatar}`
    );
    $('#username').text(`${data.user.username}#${data.user.discriminator}`);
    const Guild = data.user.guilds.find((x) => x.id == window.location.pathname.split('/')[2]);
    $('#servername').text(Guild.name);
    $('#servericon').attr(
      'src',
      Guild.icon
        ? `https://cdn.discordapp.com/icons/${Guild.id}/${Guild.icon}`
        : 'https://i.imgur.com/fFReq20.png'
    );
    // Guilds User and Bot are in and not current Guild
    const Guilds = data.user.guilds.filter(
      (guild) => guild.inGuild && guild.id != window.location.pathname.split('/')[2]
    );
    Guilds.forEach((guild) => {
      $('#serverdropdownmenu').append(
        `<li><a class="dropdown-item" href="/servers/${guild.id}"><img src=${
          guild.icon
            ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}`
            : 'https://i.imgur.com/fFReq20.png'
        } height="15"></img>${guild.name}</a></li>`
      );
    });
    if (!Guild.inGuild) {
      $.get('/api/info', (data) => {
        window.location = `https://discord.com/oauth2/authorize?client_id=${
          data.ClientID
        }&permissions=${data.Permissions}&scope=bot%20${data.Scopes.join('%20')}&redirect_uri=${
          data.Website
        }${data.CallbackURL}&response_type=code`;
      });
    }
    $('.server-name').text(Guild.name);
  });
  // eslint-disable-next-line no-undef
  var socket = io();
  socket.emit('server', window.location.pathname.split('/')[2]);

  socket.on('server', (data) => {
    $('#songLoop').text(data.songsLoop);
    $('#songInQueue').text(data.queue);
    $('#prefix').text(data.prefix);
    $('#newprefix').attr('placeholder', data.prefix);
    if (data.nowPlaying) {
      $('.needsqueue').show();
      $('.hatesqueue').hide();
      $('#now-playing').text(data.nowPlaying.title);
      $('#now-playing').replaceWith("<a id='now-playing'>" + $('#now-playing').html() + '</a>');
      $('#now-playing').attr('href', data.nowPlaying.url);
      $('#now-playing').attr('target', '_blank');
    } else {
      $('.needsqueue').hide();
      $('.hatesqueue').show();
      $('#now-playing').text(translation.web.server.song.nothing);
      $('#now-playing').replaceWith(
        "<span id='now-playing'>" + $('#now-playing').html() + '</span>'
      );
    }
    if (data.position) {
      $('#duration').html(`${data.position}<span> ${data.bar} </span>${data.maxDuration}`);
    } else {
      $('#duration').html(`<span> ${translation.web.server.song.nothingrn} </span>`);
    }
  });
});
