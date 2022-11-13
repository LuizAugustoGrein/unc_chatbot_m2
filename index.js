const env = require('./.env')
const { Telegraf, Markup } = require('telegraf')
const axios = require('axios')
const request = require('request')

const bot = new Telegraf(env.token)

function isAllowed (ctx) {
    var from = ctx.update.message.from
    var allowList = env.allowList
    var isAllowed = false
    allowList.forEach(userItem => {
        if (from.id == userItem) {
            isAllowed = true
        }
    });
    return isAllowed
}

bot.start(async ctx => {
    if (isAllowed(ctx)) {
        const from = ctx.update.message.from
        await ctx.reply(`Ola ${from.first_name}!
        Eu sou responsavel por algumas atividades, as minhas funcionalidades sao as seguintes:
            * Tenho algumas interacoes basicas
            * Informo o endereco completo e localizacao aproximada por meio de um CEP brasileiro
        Respondo a seguintes interacoes:
            * Mensagens simples
            * Mensagem de audio
            * Imagem
            * Localizacoes
            * Contatos
            * Figurinhas
        `)
    } else {
        ctx.reply(`Desculpa! infelizmente so devo responder a um grupo especifico de usuarios.`)
    }
})

bot.on('text', (ctx, next) => {
    if (isAllowed(ctx)) {
        const texto = ctx.update.message.text
        var cep = texto.replace(/[^0-9]/g,'');
        if (cep.length == 8) {
            request(`${env.apiViaCepUrl}/${cep}/json/`, async (err, res, body) => {
                var response = JSON.parse(body);
                if (!response.erro) {
                    await ctx.replyWithMarkdownV2(
                        `O CEP informado foi *${cep}*\\
    
                        Rua: ${response.logradouro}
                        Bairro: ${response.bairro}
                        Cidade: ${response.localidade}
                        Estado: ${response.uf}
                        `
                    )
                    var query = require('querystring').escape(`${response.logradouro} ${response.bairro} ${response.localidade} ${response.uf}`);
                    request(`${env.apiPositionStackUrl}&query=${query}`, async (err, res, bodyLatLon) => {
                        var responseLatLon = JSON.parse(bodyLatLon)
                        lat = JSON.stringify(responseLatLon.data[0].latitude)
                        lon = JSON.stringify(responseLatLon.data[0].longitude)
                        await ctx.replyWithHTML(`<b>Localizacao aproximada para este endereco:</b>`)
                        await ctx.replyWithLocation(lat, lon)
                    })
                } else {
                    await ctx.reply('CEP invalido')
                }
            })
        } else {
            next()
        }
    } else {
        ctx.reply(`Desculpa! infelizmente so devo responder a um grupo especifico de usuarios.`)
    }
})

bot.hears([/oi/i, /ola/i, /opa/i, /bom dia/i, /boa tarde/i, /boa noite/i], async ctx => {
    if (isAllowed(ctx)) {
        await ctx.reply(
            `Oi! como voce esta se sentindo hoje?`,
            Markup.keyboard(['😁','🙂','😡','😐','😓']).resize().oneTime()
        )
    } else {
        ctx.reply(`Desculpa! infelizmente so devo responder a um grupo especifico de usuarios.`)
    }
})

bot.hears(['😁','🙂'], async ctx => {
    if (isAllowed(ctx)) {
        await ctx.reply(`Que otimo!`)
    } else {
        ctx.reply(`Desculpa! infelizmente so devo responder a um grupo especifico de usuarios.`)
    }
})

bot.hears(['😡','😐','😓'], async ctx => {
    if (isAllowed(ctx)) {
        await ctx.reply(`Eu sinto muito por isso!`)
    } else {
        ctx.reply(`Desculpa! infelizmente so devo responder a um grupo especifico de usuarios.`)
    }
})

bot.on('location', ctx => {
    if (isAllowed(ctx)) {
        const loc = ctx.update.message.location
        ctx.replyWithPhoto({
            url: 'https://static.vecteezy.com/system/resources/previews/001/233/426/large_2x/person-holding-a-compass-free-photo.jpeg'
        })
        ctx.reply(`Legal! voce ja sabe a sua localizacao, voce se encontra nas seguintes coordenadas:

                  Latitude: ${loc.latitude},
                  Longitude: ${loc.longitude}`
        )
    } else {
        ctx.reply(`Desculpa! infelizmente so devo responder a um grupo especifico de usuarios.`)
    }
})

bot.on('contact', ctx => {
    if (isAllowed(ctx)) {
        const cont = ctx.update.message.contact
        ctx.reply(`Incrivel! a(o) ${cont.first_name} parece ser uma pessoa bem legal.
        Percebi que o seu telefone é: ${cont.phone_number}`)
    } else {
        ctx.reply(`Desculpa! infelizmente so devo responder a um grupo especifico de usuarios.`)
    }
})

bot.on('sticker', ctx => {
    if (isAllowed(ctx)) {
        const stic = ctx.update.message.sticker
        ctx.reply(`Hmmmm, vi aqui que você enviou o sticker ${stic.emoji} do conjunto ${stic.set_name}`)
    } else {
        ctx.reply(`Desculpa! infelizmente so devo responder a um grupo especifico de usuarios.`)
    }
})

bot.on('voice', ctx => {
    if (isAllowed(ctx)) {
        const voz = ctx.update.message.voice
        ctx.reply(`Uauuu! Com apenas ${voz.duration} segundos percebi que voce pode investir em uma carreira de cantor(a)!`)
        ctx.replyWithSticker('CAACAgEAAxkBAAIBlmNxK9Ws6lMJmv19iGxzuQb21vYbAALlAAN_lFhECX-kjZpFvuMrBA')
    } else {
        ctx.reply(`Desculpa! infelizmente so devo responder a um grupo especifico de usuarios.`)
    }
})

bot.on('photo', ctx => {
    if (isAllowed(ctx)) {
        const foto = ctx.update.message.photo
        ctx.replyWithMarkdownV2(`*Que foto legal*`)
        foto.forEach((photo, i) => {
        ctx.reply(`A ${i}ª foto tem resolução de ${photo.width} x ${photo.height} pixels!`)
        })
    } else {
        ctx.reply(`Desculpa! infelizmente so devo responder a um grupo especifico de usuarios.`)
    }
})

bot.startPolling()
