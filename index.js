const apiUrl = 'https://api.chainik.io/v1/';
const search = document.querySelector('#search');
const result = document.querySelector('#result');
const length = document.querySelector('.length');
let coins;

document.addEventListener('DOMContentLoaded', async () => {
  coins = await fetchCoins();
})

search.addEventListener('click', async () => {
  const amount = Number(document.querySelector('#amount').value);
  const coin = document.querySelector('#coin').value.toUpperCase();
  const distribute = document.querySelector('#dist').value.toUpperCase();
  const pools = document.querySelector('#pools').checked;
  const exclude = document.querySelector('#exclude').value.replaceAll(/[^a-zA-Z0-9,]/g, '').split(',');

  result.value = 'Waiting...'
  const balances = await fetchBalances(coin);
  if (!balances) return;
  const coinInPools = (pools) ? await fetchPools(coin) : null;
  let divs = countDivs(balances, exclude, amount, coinInPools);
  dist = (distribute === 'BIP') ? '0' : await fetchDist(distribute);
  if (!dist) return;
  result.value = divs.map(item => `${item.address},${item.divs},${dist}`).join('\n');
  length.textContent = `Total: ${divs.length} shareholders`;
})

const fetchCoins = async () => {
  const api = 'https://explorer-api.minter.network/api/v2/coins';
  return fetch(api)
    .then(res => res.json())
    .then(res => res.data);
}

const fetchDist = async (dist) => {
  return fetch(`https://explorer-api.minter.network/api/v2/coins/symbol/${dist}`)
    .then(res => res.json())
    .then(res => res.data.id)
    .catch((error) => {
      result.value = 'Got error! Try to check token for distribution ticker';
      return false;
    });
}

const fetchBalances = (coin) => {
  const api = apiUrl + `coin/${coin}/balances`;
  return fetch(api)
    .then(res => {
      if (res.ok) return res.json();
      throw new Error();
    })
    .then(res => res.data)
    .catch((error) => {
      result.value = 'Got error! Try to check token ticker';
      return false;
    });
}

const fetchPools = (coin) => {
  const api = apiUrl + `coin/${coin}/pools`;
  return fetch(api)
    .then(res => {
      if (res.ok) return res.json();
      throw new Error();
    })
    .then(res => res.data)
    .catch((error) => {
      result.value = 'Got error! Try to check token ticker';
      return false;
    });
}

const countDivs = (balances, exclude, amount, coinInPools) => {

  if (coinInPools) {
    coinInPools.forEach(itemPools => {
      let i = balances.findIndex(item => item.address === itemPools.address);
      if (i >= 0) {
        balances[i].amount = Number(balances[i].amount) + Number(itemPools.amount);
      } else {
        balances.push({ amount: itemPools.amount, address: itemPools.address });
      }
    });
  }

  balances = balances.filter(item => {
    return !exclude.includes(item.address);
  });

  let sum = balances.reduce((prev, current) => {
    prev += Number(current.amount) / 1000000000000000000;
    return prev;
  }, 0);
  return balances.map(item => { return { 'address': item.address, 'divs': Number(item.amount / 1000000000000000000 / sum) * amount } })
}

const inputHints = (string) => {
  string = string.toUpperCase();
  return coins.filter( coin => coin.symbol.includes(string));
}

const makeHints = (e) => {
  let hintBox = e.target.parentNode.querySelector('.hintbox');
  let hints = inputHints(e.target.value);
  let temp = '';
  hints.forEach(hint => {
    temp += `<div class='hint'>${hint.symbol}</div>`;
  })
  hintBox.innerHTML = temp;
  hintBox.style.display = 'block';
}

document.querySelector('#coin').addEventListener('input', (e) => {
  makeHints(e);
})

document.querySelector('#dist').addEventListener('input', (e) => {
  makeHints(e);
})

document.querySelector('#coin').addEventListener('blur', (e) => {
  setTimeout(() => {
    e.target.parentNode.querySelector('.hintbox').style.display = 'none';
  }, 200);
})

document.querySelector('#dist').addEventListener('blur', (e) => {
  setTimeout(() => {
    e.target.parentNode.querySelector('.hintbox').style.display = 'none';
  }, 200);
})

document.querySelector('#coin').addEventListener('focus', (e) => {
  if (e.target.value) e.target.parentNode.querySelector('.hintbox').style.display = 'block';
})

document.querySelector('#dist').addEventListener('focus', (e) => {
  if (e.target.value) e.target.parentNode.querySelector('.hintbox').style.display = 'block';
})

document.querySelectorAll('.hintbox').forEach(box => box.addEventListener('click', (e) => {
  console.log(e.target.closest('.inputbox'));
  e.target.closest('.inputbox').querySelector('input').value = e.target.closest('.hint').textContent;
}))

const textArea = document.querySelector('#exclude');

Object.assign(textArea.style, { resize: "none", overflow: "hidden" });
textArea.addEventListener('input', () => {
  auto_grow(textArea);
})


function auto_grow(element) {
  element.style.height = "";
  element.style.height = (element.scrollHeight) + "px";
}