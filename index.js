// importacoes
const env = require('./.env')
const { Telegraf, Markup } = require('telegraf')
const axios = require('axios')
const request = require('request')

// inicializando o bot
const bot = new Telegraf(env.token)

// funcao para verificar se o usuario esta na lista de permissoes
function isAllowed (ctx) {
    var from = ctx.update.message.from
    // allowList recebe lista de usuarios de .env
    var allowList = env.allowList
    var isAllowed = false
    allowList.forEach(userItem => {
        if (from.id == userItem) {
            isAllowed = true
        }
    });
    return isAllowed
}

// ao iniciar conversa - /start
bot.start(async ctx => {
    if (isAllowed(ctx)) {
        // objeto do usuario que enviou a mensagem
        const from = ctx.update.message.from
        // retorno de mensagem
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
        
        Vamos tentar algo? me envie o seu CEP que vou tentar informar a sua localizacao.
        `)
    } else {
        // retorno para usuario nao autorizado
        ctx.reply(`Desculpa! infelizmente so devo responder a um grupo especifico de usuarios.`)
    }
})

bot.on('text', (ctx, next) => {
    // verifica se usuario esta autorizado
    if (isAllowed(ctx)) {
        const texto = ctx.update.message.text
        // separa o cep de outros elementos em uma string enviada pelo usuario
        var cep = texto.replace(/[^0-9]/g,'');
        if (cep.length == 8) {
            // requisicao de api para resgatar os dados de endereco baseado no CEP
            request(`${env.apiViaCepUrl}/${cep}/json/`, async (err, res, body) => {
                var response = JSON.parse(body);
                if (!response.erro) {
                    // responde informando o endereco detalhadamente
                    await ctx.replyWithMarkdownV2(
                        `O CEP informado foi *${cep}*\\
    
                        Rua: ${response.logradouro}
                        Bairro: ${response.bairro}
                        Cidade: ${response.localidade}
                        Estado: ${response.uf}
                        `
                    )
                    // transforma a string em uma querystring
                    var query = require('querystring').escape(`${response.logradouro} ${response.bairro} ${response.localidade} ${response.uf}`);
                    // faz a requisicao da longitude e latitude do endereco da primeira requisicao por meio de uma API
                    request(`${env.apiPositionStackUrl}&query=${query}`, async (err, res, bodyLatLon) => {
                        var responseLatLon = JSON.parse(bodyLatLon)
                        lat = JSON.stringify(responseLatLon.data[0].latitude)
                        lon = JSON.stringify(responseLatLon.data[0].longitude)
                        await ctx.replyWithHTML(`<b>Localizacao aproximada para este endereco:</b>`)
                        // retorna com uma localizacao, informando a latitude e longitude
                        await ctx.replyWithLocation(lat, lon)
                    })
                } else {
                    // CEP nao e valido, baseado na API do ViaCep
                    await ctx.reply('CEP invalido')
                }
            })
        } else {
            // caso nao seja cep va para a proxima interacao
            next()
        }
    } else {
        // usuario nao autorizado
        ctx.reply(`Desculpa! infelizmente so devo responder a um grupo especifico de usuarios.`)
    }
})

// ao ouvir expressao regulares
bot.hears([/oi/i, /ola/i, /opa/i, /bom dia/i, /boa tarde/i, /boa noite/i], async ctx => {
    if (isAllowed(ctx)) {
        // retorna ao usuario com um texto e um teclado de markup com emojis
        await ctx.reply(
            `Oi! como voce esta se sentindo hoje?`,
            Markup.keyboard(['😁','🙂','😡','😐','😓']).resize().oneTime()
        )
    } else {
        // usuario nao autorizado
        ctx.reply(`Desculpa! infelizmente so devo responder a um grupo especifico de usuarios.`)
    }
})

// ao enviar emoji de forma manual ou pelo Markup.keyboard
bot.hears(['😁','🙂'], async ctx => {
    if (isAllowed(ctx)) {
        await ctx.reply(`Que otimo!`)
    } else {
        // usuario nao autorizado
        ctx.reply(`Desculpa! infelizmente so devo responder a um grupo especifico de usuarios.`)
    }
})

// ao enviar emoji de forma manual ou pelo Markup.keyboard
bot.hears(['😡','😐','😓'], async ctx => {
    if (isAllowed(ctx)) {
        await ctx.reply(`Eu sinto muito por isso!`)
    } else {
        // usuario nao autorizado
        ctx.reply(`Desculpa! infelizmente so devo responder a um grupo especifico de usuarios.`)
    }
})

// para resposta padrao
bot.on('text', (ctx, next) => {
    if (isAllowed(ctx)) {
        ctx.reply(`Desculpa! Nao entendi a sua solicitacao.`)
    } else {
        // usuario nao autorizado
        ctx.reply(`Desculpa! infelizmente so devo responder a um grupo especifico de usuarios.`)
    }
})

// ao usuario enviar localizacao
bot.on('location', ctx => {
    if (isAllowed(ctx)) {
        const loc = ctx.update.message.location
        // responder com foto publica
        ctx.replyWithPhoto({
            url: 'https://static.vecteezy.com/system/resources/previews/001/233/426/large_2x/person-holding-a-compass-free-photo.jpeg'
        })
        // responder com latitude e longitude de localizacao recebida
        ctx.reply(`Legal! voce ja sabe a sua localizacao, voce se encontra nas seguintes coordenadas:

                  Latitude: ${loc.latitude},
                  Longitude: ${loc.longitude}`
        )
    } else {
        // usuario nao autorizado
        ctx.reply(`Desculpa! infelizmente so devo responder a um grupo especifico de usuarios.`)
    }
})

// ao enviar contato
bot.on('contact', ctx => {
    if (isAllowed(ctx)) {
        const cont = ctx.update.message.contact
        // retorna ao usuario com o nome e numero de telefone de contato recebido
        ctx.reply(`Incrivel! a(o) ${cont.first_name} parece ser uma pessoa bem legal.
        Percebi que o seu telefone é: ${cont.phone_number}`)
    } else {
        // usuario nao autorizado
        ctx.reply(`Desculpa! infelizmente so devo responder a um grupo especifico de usuarios.`)
    }
})

// ao enviar figurinha
bot.on('sticker', ctx => {
    if (isAllowed(ctx)) {
        const stic = ctx.update.message.sticker
        // retorna com emoji e informacao de pacote de emojis
        ctx.reply(`Hmmmm, vi aqui que você enviou o sticker ${stic.emoji} do conjunto ${stic.set_name}`)
    } else {
        // usuario nao autorizado
        ctx.reply(`Desculpa! infelizmente so devo responder a um grupo especifico de usuarios.`)
    }
})

// ao enviar audio
bot.on('voice', ctx => {
    if (isAllowed(ctx)) {
        const voz = ctx.update.message.voice
        // retorna com a duracao do audio em segundos
        ctx.reply(`Uauuu! Com apenas ${voz.duration} segundos percebi que voce pode investir em uma carreira de cantor(a)!`)
        // retorna com figurinha (param: file_id)
        ctx.replyWithSticker('CAACAgEAAxkBAAIBlmNxK9Ws6lMJmv19iGxzuQb21vYbAALlAAN_lFhECX-kjZpFvuMrBA')
    } else {
        // usuario nao autorizado
        ctx.reply(`Desculpa! infelizmente so devo responder a um grupo especifico de usuarios.`)
    }
})

// ao enviar foto
bot.on('photo', ctx => {
    if (isAllowed(ctx)) {
        const foto = ctx.update.message.photo
        // para cada foto retorna uma mensagem com a resolucao
        foto.forEach((photo, i) => {
        ctx.reply(`A ${i + 1}ª foto tem resolução de ${photo.width} x ${photo.height} pixels!`)
        })
    } else {
        // usuario nao autorizado
        ctx.reply(`Desculpa! infelizmente so devo responder a um grupo especifico de usuarios.`)
    }
})

bot.startPolling()
