const crypto = require('crypto');
const axios = require('axios');

const apiKey = process.env.API_KEY;
const apiSecret = process.env.API_SECRET;
const symbol = process.env.SYMBOL; // Símbolo do par de negociação
const interval = '1h'; // Intervalo do gráfico de velas
const smaPeriod = 20; // Período da média móvel simples

// Função para criar a assinatura HMAC-SHA256
function generateSignature(queryString) {
  return crypto
    .createHmac('sha256', apiSecret)
    .update(queryString)
    .digest('hex');
}

// Função para fazer uma ordem de compra
async function createBuyOrder(quantity, price) {
  const timestamp = Date.now();
  const baseUrl = process.env.BASE_URL;
  const endpoint = '/api/v3/order';
  const queryParams = `symbol=${symbol}&side=BUY&type=LIMIT&timeInForce=GTC&quantity=${quantity}&price=${price}&timestamp=${timestamp}`;

  const signature = generateSignature(queryParams);

  const url = `${baseUrl}${endpoint}?${queryParams}&signature=${signature}`;

  try {
    const response = await axios.post(url, null, {
      headers: {
        'X-MBX-APIKEY': apiKey,
      },
    });

    console.log('Ordem de compra criada:', response.data);
  } catch (error) {
    console.error('Erro ao criar ordem de compra:', error.response.data);
  }
}

// Função para fazer uma ordem de venda
async function createSellOrder(quantity, price) {
  const timestamp = Date.now();
  const baseUrl = process.env.BASE_URL;
  const endpoint = '/api/v3/order';
  const queryParams = `symbol=${symbol}&side=SELL&type=LIMIT&timeInForce=GTC&quantity=${quantity}&price=${price}&timestamp=${timestamp}`;

  const signature = generateSignature(queryParams);

  const url = `${baseUrl}${endpoint}?${queryParams}&signature=${signature}`;

  try {
    const response = await axios.post(url, null, {
      headers: {
        'X-MBX-APIKEY': apiKey,
      },
    });

    console.log('Ordem de venda criada:', response.data);
  } catch (error) {
    console.error('Erro ao criar ordem de venda:', error.response.data);
  }
}

// Função para verificar se o mercado está favorável
async function isMarketFavorable() {
  const baseUrl = process.env.BASE_URL;
  const endpoint = '/api/v3/klines';

  // Obtendo dados do gráfico de velas do par de negociação
  const response = await axios.get(`${baseUrl}${endpoint}?symbol=${symbol}&interval=${interval}&limit=${smaPeriod}`);
  const candleData = response.data;

  // Calculando a média móvel simples
  const prices = candleData.map(candle => parseFloat(candle[4])); // Usando o preço de fechamento (índice 4)
  const sma = calculateSMA(prices);

  // Verificando se o preço atual está acima da média móvel
  const currentPrice = parseFloat(candleData[candleData.length - 1][4]); // Último preço de fechamento
  const isFavorable = currentPrice > sma;

  return isFavorable;
}

// Função para calcular a média móvel simples (SMA)
function calculateSMA(prices) {
  if (prices.length < smaPeriod) {
    throw new Error('Não há dados suficientes para calcular a SMA.');
  }

  const sum = prices.slice(0, smaPeriod).reduce((acc, price) => acc + price, 0);
  const sma = sum / smaPeriod;

  return sma;
}

// Função principal para tomar decisões com base no mercado
async function makeTradingDecision() {
  if (await isMarketFavorable()) {
    const buyQuantity = '0.001'; // Quantidade da moeda a comprar
    const buyPrice = '50000'; // Preço de compra

    await createBuyOrder(buyQuantity, buyPrice);
  } else {
    const sellQuantity = '0.001'; // Quantidade da moeda a vender
    const sellPrice = '55000'; // Preço de venda

    await createSellOrder(sellQuantity, sellPrice);
  }
}

// Exemplo de uso
makeTradingDecision();
