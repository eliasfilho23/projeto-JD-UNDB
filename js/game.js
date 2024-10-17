class Building {
  constructor(name, cost, effect, upgrades, locked = true) {
    this.name = name;
    this.amount = 0;
    this.originalCost = cost;
    this.cost = cost;
    this.multiplier = 1;
    this.baseEffect = effect;
    this.specialCPS = 0;
    this.effect = 0;
    this.upgrades = upgrades;
    this.locked = locked;
  }

  buy(amount) {
    let player = game.player;
    if (player.spendCookies(this.getCost(amount)) == true) {
      this.amount += amount;
      this.cost = Math.round(this.cost * Math.pow(1.15, amount));
      game.settings.recalculateCPS = true;
      let curIndex = game.utilities.getBuildingIndexByName(this.name);
      if (curIndex + 1 <= game.buildings.length - 1) {
        let nextBuilding = game.buildings[curIndex + 1];
        if (nextBuilding.locked == true) {
          nextBuilding.locked = false;
          game.constructShop();
        }
      }
    }
  }

  setCost() {
    this.cost = this.originalCost;
    for (let i = 0; i < this.amount; i++) {
      this.cost = Math.round(this.cost * 1.15);
    }
  }

  buyUpgrade(name) {
    let player = game.player;
    this.upgrades.forEach((upgrade) => {
      if (upgrade.name == name) {
        if (player.spendCookies(upgrade.cost) == true) {
          upgrade.owned = true;
          game.settings.recalculateCPS = true;
          return;
        }
      }
    });
  }

  calculateEffectOfUpgrades() {
    let player = game.player;
    let multiplier = 1;
    let buildingCount = game.utilities.getBuildingCount();
    this.specialCPS = 0;
    if (this.name == "Voluntário") {
      game.player.aMPC = 1;
    }
    this.upgrades.forEach((upgrade) => {
      if (upgrade.owned == true) {
        if (upgrade.special == false) {
          multiplier *= 2;
          if (this.name == "Voluntário") {
            player.aMPC *= 2;
          }
        } else {
          // Special casing for all special types of upgrades
          // There may at some point be more than just cursors here, as theres special stuff for grandmas as well.
          switch (this.name) {
            case "Voluntário":
              let nonCursorBuildingCount = buildingCount - this.amount;
              this.specialCPS +=
                upgrade.special * nonCursorBuildingCount * this.amount;
              player.aMPC += upgrade.special * nonCursorBuildingCount;
          }
        }
      }
    });
    return multiplier;
  }

  getCPS() {
    this.multiplier = this.calculateEffectOfUpgrades();
    this.effect =
      this.baseEffect * this.amount * this.multiplier + this.specialCPS;
    return this.effect;
  }

  getCost(amount) {
    let bulkCost = this.cost;
    let tempPrice = this.cost;
    for (let i = 0; i < amount - 1; i++) {
      bulkCost += Math.round((tempPrice *= 1.15));
    }
    return bulkCost;
  }

  generateMenuButton() {
    return `<button onclick="game.updateShop('${this.name}');">${this.name}</button>`;
  }

  generateBuyButtons() {
    let format = game.utilities.formatNumber;
    let html = '<div class="btnBuyGroup">';
    html += `<button onclick="game.buyBuilding('${
      this.name
    }', 1);">Financiar 1 unidade</br><b>${format(this.cost)}</b></button>`;
    html += `<button onclick="game.buyBuilding('${
      this.name
    }', 5);">Financiar 5 unidades</br><b>${format(
      this.getCost(5)
    )}</b></button>`;
    html += `<button onclick="game.buyBuilding('${
      this.name
    }', 10);">Financiar 10 unidades</br><b>${format(
      this.getCost(10)
    )}</b></button>`;
    html += "</div>";
    return html;
  }

  generateUpgradeButtons() {
    let html = "";
    let notMet = false;
    this.upgrades.forEach((upgrade) => {
      let format = game.utilities.formatNumber;
      if (upgrade.owned == false) {
        if (upgrade.requirementMet(this.amount)) {
          html += `<button class="upgBtn" onclick="game.buyUpgrade('${
            this.name
          }', '${upgrade.name}')"><b>${upgrade.name}</b></br>${
            upgrade.desc
          }</br><b>${format(upgrade.cost)}</b></button>`;
        } else {
          if (notMet == false) {
            notMet = true;
            html += `</br><button class="upgNext">Próximo Upgrade desbloqueado em <b>${
              upgrade.limit - this.amount
            }</b> ${this.name.toLowerCase()}(s)</button>`;
          }
        }
      }
    });
    return html;
  }

  retrieveBuildingStats() {
    const buildingStats = game.buildings.map((el) => {
      if (el.amount > 0) {
        return { name: el.name, amount: el.amount };
      }
    });
    return buildingStats;
  }

  generateShopHTML() {
    let format = game.utilities.formatNumber;
    let singleEffect = this.baseEffect * this.multiplier;
    if (this.specialCPS > 0) {
      singleEffect += this.specialCPS / this.amount;
    }
    let html = `<div class='shopHTMLText' style='font-size: 20px'><b style='font-size: 40px; letter-spacing: 1px'>
            ${this.name}</b></br>Você possui <b style='font-size: 26px'>${
      this.amount
    }</b>
             ${this.name.toLowerCase()}(s).</br>Cada ${this.name.toLowerCase()}
              produz <b style='font-size: 26px'>${format(
                singleEffect
              )}</b> ponto(s) de impacto.</br>
              Todos os ${this.name.toLowerCase()}(s) juntos produzem um total de 
              <b style='font-size: 26px'>${format(
                this.effect
              )}</b> ponto(s).</br>${this.generateBuyButtons()}</br>
              ${this.generateUpgradeButtons()}</div>`;
    return html;
  }
}
const buildToActivateMethod = new Building();

class UpgradeHall {
  upgradeHallHTMLSections =
    document.getElementsByClassName("upgrade-hall-child");

  returnElAmountBySectionId() {
    const buildingStats = buildToActivateMethod.retrieveBuildingStats();
    buildingStats.forEach((el) => {
      if (el) {
        el.name = el.name.toLowerCase().split(" ").join("");
      }
    });
    const relationIdAmount = [];
    for (let i = 0; i < this.upgradeHallHTMLSections.length; i++) {
      if (this.upgradeHallHTMLSections[i]) {
        const currentParsedElement = this.upgradeHallHTMLSections[i];
        const buildingName = currentParsedElement.id;
        const currentSection = buildingStats.find((el) =>
          el ? el.name === buildingName : ""
        );
        if (currentSection) {
          let currentSectionElementToDisplayAmount;
          currentSection.amount >= 8
            ? (currentSectionElementToDisplayAmount = 8)
            : (currentSectionElementToDisplayAmount = currentSection.amount);
          relationIdAmount.push({
            sectionIdAndName: currentParsedElement.id,
            amount: currentSectionElementToDisplayAmount,
          });
        }
      }
    }
    return relationIdAmount;
  }

  updateUpgradeHallHTML() {
    const data = this.returnElAmountBySectionId();
    const relation = {
      voluntário: "worker",
      miniusinahidrelétrica: "hydroeletric-plant",
      fossasépticabiodigestora: "biodigester",
      centrodecompostagem: "composting-center",
      satélite: "satellite",
      painelsolar: "solar-panel",
      sistemaagroflorestal: "agroforestry-system",
    };

    data &&
      data.forEach((el) => {
        const currentSection = document.getElementById(el.sectionIdAndName);
        for (let i = 0; i < el.amount; i++) {
          currentSection.style = "visibility: visible";
          currentSection.childNodes.length !== el.amount
            ? (currentSection.innerHTML += `
              <img class='upgrade-hall-image'
               style='height: 90%; margin-right: 10px; margin-top:20px'
                     src='./images/upgrade-hall-sprites/${
                       relation[
                         el.sectionIdAndName.toLowerCase().split(" ").join("")
                       ]
                     }-sprite.png'
                      alt='${el.sectionIdAndName}'/>`)
            : "";
        }
      });
      const images = document.getElementsByClassName('upgrade-hall-image')
      for(let i = 0; i < images.length; i++){
        images[i].addEventListener('mouseover', (event) => {
          console.log(event.target)
        })
      }
  }
}

class Upgrade {
  constructor(name, cost, desc, limit, special = false) {
    this.name = name;
    this.cost = cost;
    this.desc = desc;
    this.limit = limit;
    this.owned = false;
    this.special = special;
  }

  requirementMet(amount) {
    if (amount >= this.limit) {
      return true;
    }
  }
}

const challengeDiv = document.getElementById("challenge-div");
const anwserRelationHTML = [
  {
    limit: 10,
    trueText: "Resposta Correta!",
    falseText: "Resposta Falsa!",
    detail: `
    O Curupira é uma das figuras mais icônicas do folclore amazônico,
    conhecido por proteger a floresta e seus animais contra caçadores e desmatadores.
    Ele é descrito como um ser pequeno, de cabelos vermelhos e pés virados para trás, 
    o que confunde aqueles que tentam segui-lo. Sua missão é proteger a fauna e flora,
    punindo aqueles que agem de forma predatória e destrutiva contra a floresta.
    Essa lenda reflete a reverência das populações amazônicas pela natureza e seu desejo
    de preservar o ambiente em que vivem, transmitindo uma mensagem de respeito e harmonia com a floresta
    `,
    alreadyPopped: false,
  },
  {
    limit: 50,
    trueText: "Resposta Correta!",
    falseText: "Resposta Falsa!",
    falseText: "Resposta Falsa!",
    detail: `
      A pesca com tarrafa e armadilhas artesanais é uma prática tradicional entre os ribeirinhos da Amazônia.
      Essas comunidades dependem fortemente dos rios para sua subsistência, e essas técnicas de pesca são transmitidas de geração em geração.
      A tarrafa é uma rede circular que é lançada manualmente sobre a água, e as armadilhas,
      como as matapis (feitas de palha de buriti), são dispositivos artesanais que capturam peixes de maneira sustentável.
      Essa forma de pesca respeita os ciclos da natureza e permite que as populações ribeirinhas 
      vivam em harmonia com os recursos aquáticos, sem causar grandes impactos nos ecossistemas fluviais.
    `,
    alreadyPopped: false,
  },
  {
    limit: 100,
    trueText: "Resposta Correta!",
    falseText: "Resposta Falsa!",
    detail: `
    O tacacá é um prato típico da culinária amazônica, especialmente consumido pelas comunidades ribeirinhas. Ele é feito com ingredientes
    locais como o tucupi, um caldo amarelo extraído da mandioca brava, e o jambu, uma erva amazônica que causa uma leve dormência na boca.
    O prato também inclui camarões e goma de tapioca, resultando em uma refeição leve, mas rica em sabores característicos da região.
    O tacacá reflete a forte conexão dos ribeirinhos com os recursos naturais ao seu redor, aproveitando ingredientes frescos e regionais em sua culinária diária.
    `,
    alreadyPopped: false,
  },
  {
    limit: 150,
    trueText: "Resposta Correta!",
    falseText: "Resposta Falsa!",
    detail: `
    A farinhada é o processo tradicional de fabricação da farinha de mandioca, que é um alimento essencial na dieta dos ribeirinhos e de muitas outras populações
    da Amazônia. A farinha de mandioca é feita a partir da mandioca brava, que deve ser processada cuidadosamente para remover o ácido cianídrico, uma substância tóxica.
    Durante a farinhada, várias etapas são seguidas, como descascar, ralar, prensar e torrar a mandioca, até que se transforme em farinha. Esse processo é muitas vezes comunitário,
    envolvendo várias famílias que trabalham juntas, e também é uma ocasião social e cultural importante para as comunidades amazônicas.
    `,
    alreadyPopped: false,
  },
  {
    limit: 200,
    trueText: "Resposta Correta!",
    falseText: "Resposta Falsa!",
    detail: `
    A Festa de São Pedro é uma celebração muito importante para as comunidades ribeirinhas da Amazônia,
    já que São Pedro é considerado o padroeiro dos pescadores. Essa festa acontece geralmente no final de junho
    e é uma forma de agradecer pelos peixes capturados e pedir proteção para futuras pescas. Durante o evento, 
    há procissões, missas e também festividades populares que incluem danças, músicas e comidas típicas. 
    A festa reflete a forte dependência dos ribeirinhos em relação ao rio, que é fonte de alimento, transporte e cultura,
    e demonstra sua gratidão e respeito pelos ciclos naturais das águas e dos peixes.
    `,
    alreadyPopped: false,
  },
  {
    limit: 300,
    trueText: "Resposta Correta!",
    falseText: "Resposta Falsa!",
    detail: `
    `,
    alreadyPopped: false,
  },
];
let currentChallengeCounter = 1;
class Challenges {
  initChallengeRelation() {
    anwserRelationHTML.forEach((entry) => {
      if (game.player.cookieStats.Earned > entry.limit) {
        entry.alreadyPopped = true;
      }
    });
  }

  handleChallengePopUpTrigger() {
    // index + 1 = n ; index dos challenges
    if (
      game.player.cookieStats.Earned >
        anwserRelationHTML[currentChallengeCounter - 1].limit &&
      anwserRelationHTML[currentChallengeCounter - 1].alreadyPopped === false
    ) {
      this.handleChallengeDisplay(currentChallengeCounter);
      anwserRelationHTML[currentChallengeCounter - 1].alreadyPopped = true;
      currentChallengeCounter += 1;
    }
  }

  generateChallengeHTML(challenge) {
    challengeDiv.className = "challengeDiv";
    challengeDiv.style = "";
    switch (challenge) {
      case 1:
        challengeDiv.innerHTML = `<div class='challengeDivTitle'>Desafio Quiz</div>
                <div class='challengeDivContent'>
                   <img class='challengeDivImg' src='images/cookie.png'/>
                   <div class='challengeDivText'>
                       O Curupira é uma figura do folcore amazônico, associado
                       ao cultivo e preservação do campos agrícolas?
                   condimentum mattis neque. 
                   </div>
               </div>
                <div class='challengeDivButtons'> 
                    <button class='challenge1Btns'>Verdadeiro</button>
                    <button class='challenge1Btns'>Falso</button>
               </div>
                    `;
        break;
      case 2:
        challengeDiv.innerHTML = `<div class='challengeDivTitle'>Desafio Quiz</div>
                    <div class='challengeDivContent'>
                    <img class='challengeDivImg' src='images/cookie.png'/>
                    <div class='challengeDivText'>
                        A prática da pesca é essencial para os ribeirinhos da Amazônia.
                        Qual técnica de pesca tradicional é amplamente utilizada nas comunidades ribeirinhas?
                    </div>
                </div>
                <div class='challengeDivButtons'>
                   <button class='challenge2Btns'>Pesca com redes de arrasto</button>
                   <button class='challenge2Btns'>Pesca com tarrafa e armadilhas artesanais</button>
                   <button class='challenge2Btns'>Pesca com vara e anzol, isca improvisada</button>
                   <button class='challenge2Btns'> Pesca com equipamentos eletrônicos de última geração</button>
                </div>
                `;
        break;
      case 3:
        challengeDiv.innerHTML = `<div class='challengeDivTitle'>Desafio Quiz</div>
                      <div class='challengeDivContent'>
                      <img class='challengeDivImg' src='images/cookie.png'/>
                      <div class='challengeDivText'>
                          A culinária dos ribeirinhos é profundamente influenciada
                           pelos recursos naturais da floresta. Qual destes pratos típicos
                            é tradicionalmente consumido nas comunidades amazônicas?
                      </div>
                  </div>
                  <div class='challengeDivButtons'>
                     <button class='challenge3Btns'>Igarapé-do-Mato</button>
                     <button class='challenge3Btns'>Murici Assado</button>
                     <button class='challenge3Btns'>Tijé</button>
                     <button class='challenge3Btns'>Tacacá</button>
                  </div>
                  `;
        break;
      case 4:
        challengeDiv.innerHTML = `<div class='challengeDivTitle'>Desafio Quiz</div>
                        <div class='challengeDivContent'>
                        <img class='challengeDivImg' src='images/challenges/challenge-4-image.jpg'/>
                        <div class='challengeDivText'>
                          Qual é o nome do costume tradicional amazônico que envolve o preparo e consumo da farinha de mandioca,
                           um dos alimentos mais importantes para os ribeirinhos?    
                        </div>
                    </div>
                    <div class='challengeDivButtons'>
                       <button class='challenge4Btns'>Farinhada</button>
                       <button class='challenge4Btns'>Tecelagem do tucum</button>
                       <button class='challenge4Btns'>Roda de peixe</button>
                       <button class='challenge4Btns'>elebração do açaí</button>
                    </div>
                    `;
        break;
      case 5:
        challengeDiv.innerHTML = `<div class='challengeDivTitle'>Desafio Quiz</div>
                          <div class='challengeDivContent'>
                          <img class='challengeDivImg' src='images/cookie.png'/>
                          <div class='challengeDivText'>
                            Os ribeirinhos realizam festas e rituais ligados ao ciclo das águas na Amazônia.
                           Qual destas celebrações marca a relação dos ribeirinhos com o rio e as mudanças de estação?    
                          </div>
                      </div>
                      <div class='challengeDivButtons'>
                         <button class='challenge5Btns'>Festa de São Pedro, o padroeiro dos pescadores</button>
                         <button class='challenge5Btns'>Festa da Colheita</button>
                         <button class='challenge5Btns'>Festa do Pirarucu</button>
                         <button class='challenge5Btns'>Festa da Pequi</button>
                      </div>
                      `;
        break;
    }
  }

  handleChallengeAnwser(challengeHTML, challengeHTMLDetail, won, amount) {
    challengeDiv.innerHTML = `
            <div class='challengeDivTitle' ${
              won === true ? 'style="color: green"' : 'style="color: red"'
            }>
            ${challengeHTML}
            </div>
            <div class='challengeDivText'>
            ${challengeHTMLDetail}
            </div>
            ${
              won === true
                ? `
                <div style='font-size: xx-large; text-align:center'>Ganhou ${amount} pontos!</div>`
                : ""
            }
            <div class='challengeDivButtons'>
                <button class='challenge-anwser-close-btn challenge1Btns'>Fechar</button>
            </div>
            `;
    const anwserCloseBtn = document.getElementsByClassName(
      "challenge-anwser-close-btn"
    )[0];
    anwserCloseBtn.addEventListener("click", () => {
      challengeDiv.style = "display: none";
      challengeDiv.innerHTML = "";
    });
  }
  // fazer igual o challenge counter
  handleChallengeDisplay(n) {
    switch (n) {
      case 1:
        this.generateChallengeHTML(1);
        const challenge1Btns =
          document.getElementsByClassName("challenge1Btns");
        for (let i = 0; i < challenge1Btns.length; i++) {
          challenge1Btns[i].addEventListener("click", () => {
            i === 1
              ? (game.player.earnCookie(20),
                this.handleChallengeAnwser(
                  anwserRelationHTML[0].trueText,
                  anwserRelationHTML[0].detail,
                  true,
                  79
                ))
              : this.handleChallengeAnwser(
                  anwserRelationHTML[0].falseText,
                  anwserRelationHTML[0].detail
                );
          });
        }
        break;
      case 2:
        this.generateChallengeHTML(2);
        const challenge2Btns =
          document.getElementsByClassName("challenge2Btns");
        for (let i = 0; i < challenge2Btns.length; i++) {
          challenge2Btns[i].addEventListener("click", () => {
            i === 1
              ? (game.player.earnCookie(20),
                this.handleChallengeAnwser(
                  anwserRelationHTML[1].trueText,
                  anwserRelationHTML[1].detail,
                  true,
                  79
                ))
              : this.handleChallengeAnwser(
                  anwserRelationHTML[1].falseText,
                  anwserRelationHTML[1].detail
                );
          });
        }
        break;
      case 3:
        this.generateChallengeHTML(3);
        const challenge3Btns =
          document.getElementsByClassName("challenge3Btns");
        for (let i = 0; i < challenge3Btns.length; i++) {
          challenge3Btns[i].addEventListener("click", () => {
            i === 3
              ? (game.player.earnCookie(20),
                this.handleChallengeAnwser(
                  anwserRelationHTML[2].trueText,
                  anwserRelationHTML[2].detail,
                  true,
                  79
                ))
              : this.handleChallengeAnwser(
                  anwserRelationHTML[2].falseText,
                  anwserRelationHTML[2].detail
                );
          });
        }
        break;
      case 4:
        this.generateChallengeHTML(4);
        const challenge4Btns =
          document.getElementsByClassName("challenge4Btns");
        for (let i = 0; i < challenge4Btns.length; i++) {
          challenge4Btns[i].addEventListener("click", () => {
            i === 0
              ? (game.player.earnCookie(20),
                this.handleChallengeAnwser(
                  anwserRelationHTML[3].trueText,
                  anwserRelationHTML[3].detail,
                  true,
                  79
                ))
              : this.handleChallengeAnwser(
                  anwserRelationHTML[3].falseText,
                  anwserRelationHTML[3].detail
                );
          });
        }
        break;
      case 5:
        this.generateChallengeHTML(5);
        const challenge5Btns = document.getElementsByClassName("challenge5Btns");
        for (let i = 0; i < challenge5Btns.length; i++) {
          challenge5Btns[i].addEventListener("click", () => {
            i === 0
              ? (game.player.earnCookie(20),
                this.handleChallengeAnwser(
                  anwserRelationHTML[4].trueText,
                  anwserRelationHTML[4].detail,
                  true,
                  79
                ))
              : this.handleChallengeAnwser(
                  anwserRelationHTML[4].falseText,
                  anwserRelationHTML[4].detail
                );
          });
        }
        break;
    }
  }
}
class Player {
  constructor() {
    this.cookies = 0;
    this.cookieStats = {
      Earned: 0,
      Spent: 0,
      Clicked: 0,
    };
    this.aMPF = 0;
    this.aMPC = 1;
  }

  earnCookie(amount) {
    this.cookies += amount;
    this.cookieStats.Earned += amount;
  }

  spendCookies(amount) {
    if (this.cookies >= amount) {
      this.cookies -= amount;
      this.cookieStats.Spent += amount;
      return true;
    }
  }

  clickCookie() {
    this.earnCookie(this.aMPC);
    this.cookieStats.Clicked += this.aMPC;
  }
}

let game = {
  settings: {
    frameRate: 30,
    recalculateCPS: true,
    key: "cookieclicker",
  },
  achievements: [
    {
      name: "Cada ajuda é significativa",
      status: "disabled",
      description: "Adquiriu um ponto de impacto",
      trigger: "limit",
      triggerDetail: 1,
    },
    {
      name: "Amigo da causa",
      status: "disabled",
      description: "Adquiriu 25 pontos de impacto",
      trigger: "limit",
      triggerDetail: 25,
    },
    {
      name: "Bolso generoso para a amazônia",
      status: "disabled",
      description: "Adquiriu 100 pontos de impacto",
      trigger: "limit",
      triggerDetail: 100,
    },
    {
      name: "Começando o impacto",
      status: "disabled",
      description: "Adquiriu 500 pontos de impacto",
      trigger: "limit",
      triggerDetail: 500,
    },
    {
      name: "Mobilizador da causa",
      status: "disabled",
      description: "Adquiriu 1000 pontos de impacto",
      trigger: "limit",
      triggerDetail: 1000,
    },
    {
      name: "Garoto-propaganda da NAPRA",
      status: "disabled",
      description: "Adquiriu 2500 pontos de impacto",
      trigger: "limit",
      triggerDetail: 2500,
    },
    {
      name: "You gotta go far, kid",
      status: "disabled",
      description: "Adquiriu 5000 pontos de impacto",
      trigger: "limit",
      triggerDetail: 5000,
    },
    {
      name: "Inspiração do Joe Duplantier",
      status: "disabled",
      description: "Fez 1000 cookies",
      trigger: "limit",
      triggerDetail: 10000,
    },
    {
      name: "Qualquer ajuda conta",
      status: "disabled",
      description: "Financiou um voluntário",
      trigger: "buildingLimit",
      triggerDetail: ["Voluntário", 1],
    },
    {
      name: "Inspirador",
      status: "disabled",
      description: "Financiou 10 voluntários",
      trigger: "buildingLimit",
      triggerDetail: ["Voluntário", 10],
    },
    {
      name: "Aprendendo a influenciar",
      status: "disabled",
      description: "Financiou 25 voluntários",
      trigger: "buildingLimit",
      triggerDetail: ["Voluntário", 25],
    },
    {
      name: "Mobilizador de comunidades",
      status: "disabled",
      description: "Financiou 50 voluntários",
      trigger: "buildingLimit",
      triggerDetail: ["Voluntário", 50],
    },
    {
      name: "Manus Populi, Vox Populi",
      status: "disabled",
      description: "Financiou 100 voluntários",
      trigger: "buildingLimit",
      triggerDetail: ["Voluntário", 100],
    },
    {
      name: "Mini instalação, Enorme ajuda",
      status: "disabled",
      description: "Financiou uma mini-usina hidrelétrica",
      trigger: "buildingLimit",
      triggerDetail: ["Mini usina hidrelétrica", 1],
    },
    {
      name: "Cobertura de alguma parcela",
      status: "disabled",
      description: "Financiou 10 mini-usinas hidrelétricas",
      trigger: "buildingLimit",
      triggerDetail: ["Mini usina hidrelétrica", 10],
    },
    {
      name: "Contrato com distribuidora",
      status: "disabled",
      description: "Financiou 25 mini-usina hidrelétricas",
      trigger: "buildingLimit",
      triggerDetail: ["Mini usina hidrelétrica", 25],
    },
    {
      name: "Fornecimento integral",
      status: "disabled",
      description: "Financiou 50 mini-usina hidrelétricas",
      trigger: "buildingLimit",
      triggerDetail: ["Mini usina hidrelétrica", 50],
    },
    {
      name: "Revolução hidrelétrica",
      status: "disabled",
      description: "Financiou 100 mini-usina hidrelétricas",
      trigger: "buildingLimit",
      triggerDetail: ["Mini usina hidrelétrica", 100],
    },
    {
      name: "Na natureza, nada se cria",
      status: "disabled",
      description: "Financiou uma fossa séptica biodigestora",
      trigger: "buildingLimit",
      triggerDetail: ["Fossa séptica biodigestora", 1],
    },
    {
      name: "Uma boa quantidade",
      status: "disabled",
      description: "Financiou 10 fossas sépticas biodigestoras",
      trigger: "buildingLimit",
      triggerDetail: ["Fossa séptica biodigestora", 10],
    },
    {
      name: "Tratamento completo e eficiente",
      status: "disabled",
      description: "Financiou 25 fossas sépticas biodigestoras",
      trigger: "buildingLimit",
      triggerDetail: ["Fossa séptica biodigestora", 25],
    },
    {
      name: "Definitivamente, muito adubo",
      status: "disabled",
      description: "Financiou 50 fossas sépticas biodigestoras",
      trigger: "buildingLimit",
      triggerDetail: ["Fossa séptica biodigestora", 50],
    },
    {
      name: "Potestas Feces",
      status: "disabled",
      description: "Financiou 100 fossas sépticas biodigestoras",
      trigger: "buildingLimit",
      triggerDetail: ["Fossa séptica biodigestora", 100],
    },
    {
      name: "Dá pra ver a minha casa daqui",
      status: "disabled",
      description: "Financiou um satélite",
      trigger: "buildingLimit",
      triggerDetail: ["Satélite", 1],
    },
    {
      name: "Corrida Espacial",
      status: "disabled",
      description: "Financiou 10 satélites",
      trigger: "buildingLimit",
      triggerDetail: ["Satélite", 10],
    },
    {
      name: "Serjão ficaria orgulhoso",
      status: "disabled",
      description: "Financiou 25 satélites",
      trigger: "buildingLimit",
      triggerDetail: ["Satélite", 25],
    },
    {
      name: "FYI, a imagem do satélite é literalmente um easter egg",
      status: "disabled",
      description: "Financiou 50 satélites",
      trigger: "buildingLimit",
      triggerDetail: ["Satélite", 50],
    },
    {
      name: "A terra não é sua para conquistar. Mas o espaço...",
      status: "disabled",
      description: "Financiou 100 satélites",
      trigger: "buildingLimit",
      triggerDetail: ["Satélite", 100],
    },
    {
      name: "Guaraci financiando o esquema",
      status: "disabled",
      description: "Financiou um painel solar",
      trigger: "buildingLimit",
      triggerDetail: ["Painel solar", 1],
    },
    {
      name: "Here Comes The Sun",
      status: "disabled",
      description: "Financiou 10 painéis solares",
      trigger: "buildingLimit",
      triggerDetail: ["Painel solar", 10],
    },
    {
      name: "Praise the Sun",
      status: "disabled",
      description: "Financiou 25 painéis solares",
      trigger: "buildingLimit",
      triggerDetail: ["Painel solar", 25],
    },
    {
      name: "Pique HELIOS One",
      status: "disabled",
      description: "Financiou 50 painéis solares",
      trigger: "buildingLimit",
      triggerDetail: ["Painel solar", 50],
    },
    {
      name: "O poder do sol, na palma da minha mão",
      status: "disabled",
      description: "Financiou 100 painéis solares",
      trigger: "buildingLimit",
      triggerDetail: ["Painel solar", 100],
    },
  ],

  //   relateAchievementsStatus() {
  //     let relation = "";
  //     this.achievements.map((ac) => {
  //       ac.status === "disabled" ? (relation += "0") : (relation += "1");
  //     });
  //     return relation;
  //   }

  updateAchievementHTML() {
    let finalHtml = "";
    const achievementContainerHeader = document.getElementsByClassName(
      "achievement-list-header"
    )[0];
    const { enabledAc, totalAc } = game.utilities.getAchievementRelation();

    // currentStatusTitle.innerHTML = 'Conquistas'
    this.achievements.forEach((ac) => {
      if (ac.status === "enabled") {
        finalHtml += `<div style='color: white; text-shadow: 3px 3px 10px black;' class='cookie-achievement-list-child'>
                    <h3>${ac.name}</h3>
                    <div>${ac.description}</div>
                </div>`;
      }
    });
    game.utilities.updateText("achievements-list", finalHtml);
    achievementContainerHeader.innerHTML = `<div style='color: white; font-size:20px; margin-top: 20px'>
        Conquistas adquiridas: ${enabledAc} de ${totalAc} <span style='font-size: 30px'>
        (${(enabledAc / (totalAc / 100)).toFixed(2)}%)</span>
        </div>`;
    // this.relateAchievementsStatus();
  },

  totalCookiesAchievementTriggerListener() {
    const currentCookies = game.player.cookieStats.Earned;
    const achievementPopUpDiv = document.getElementsByClassName(
      "currentAchievementPopUp"
    )[0];
    this.achievements.forEach((ac) => {
      if (ac.trigger === "limit" && ac.status === "disabled") {
        currentCookies >= ac.triggerDetail
          ? ((ac.status = "enabled"),
            (achievementPopUpDiv.innerHTML = `
        <div class="achievement-pop-up" id="pop-up">
            <div class="achievement-pop-up-content">
                    <h1>Conquista Desbloqueada!</h1>
                    <h3>${ac.name}</h3>
                    <p>${ac.description}</p>
                    <button class='achievement-pop-up-btn' type="button">X</button>
            </div>
          </div>`))
          : "";
      }
    });
    const achievementPopUp = document.getElementsByClassName(
      "achievement-pop-up-btn"
    )[0];
    achievementPopUp &&
      achievementPopUp.addEventListener("click", () => {
        achievementPopUpDiv.innerHTML = "";
      });
    this.updateAchievementHTML();
  },

  buildingBuyingAchievementTriggerListener(building) {
    console.log(building);
    const achievementPopUpDiv = document.getElementsByClassName(
      "currentAchievementPopUp"
    )[0];
    this.achievements.forEach((ac) => {
      if (ac.trigger === "buildingLimit" && ac.status === "disabled") {
        building.amount >= ac.triggerDetail[1] &&
        building.name === ac.triggerDetail[0]
          ? ((ac.status = "enabled"),
            (achievementPopUpDiv.innerHTML = `
      <div class="achievement-pop-up" id="pop-up">
          <div class="achievement-pop-up-content">
                  <h1>Conquista Desbloqueada!</h1>
                  <h3>${ac.name}</h3>
                  <p>${ac.description}</p>
                  <button class='achievement-pop-up-btn' type="button">X</button>
          </div>
        </div>`))
          : "";
      }
    });
    const achievementPopUp = document.getElementsByClassName(
      "achievement-pop-up-btn"
    )[0];
    achievementPopUp &&
      achievementPopUp.addEventListener("click", () => {
        achievementPopUpDiv.innerHTML = "";
      });
    this.updateAchievementHTML();
  },

  constructAchievements() {
    const currentCookies = game.player.cookieStats.Earned;
    this.achievements.forEach((ac) => {
      if (ac.trigger === "limit" && ac.status === "disabled") {
        currentCookies >= ac.triggerDetail ? (ac.status = "enabled") : "";
      }
      if (ac.trigger === "buildingLimit" && ac.status === "disabled") {
        game.buildings.forEach((el) => {
          if (
            el.name === ac.triggerDetail[0] &&
            el.amount >= ac.triggerDetail[1]
          ) {
            ac.status = "enabled";
          } else "";
        });
      }
    });
    this.updateAchievementHTML();
  },

  challengeActions: new Challenges(),

  news: {
    defaultNewsArray: [
      { news: "lorem ipsum 1", limit: 10 },
      { news: "lorem ipsum 2", limit: 20 },
      { news: "dolor sit amet 3", limit: 40 },
      { news: "consectetur adipiscing 4", limit: 70 },
      { news: "elit sed do 5", limit: 110 },
      {
        news: "A instalação de painéis solares reduz os custos de energia, e as famílias se sentem mais empoderadas em suas escolhas.",
        limit: 160,
      },
      { news: "incididunt ut 7", limit: 220 },
      { news: "labore et dolore 8", limit: 290 },
      { news: "magna aliqua 9", limit: 370 },
      { news: "ut enim ad 10", limit: 460 },
      {
        news: "As fossas biodigestoras transformam a saúde das comunidades, e a qualidade de vida melhora significativamente",
        limit: 560,
      },
    ],
    milestoneNewsArray: [
      { news: "Com a pouca ajuda que você empenhou em fornecer, alguns indivíduos são beneficiados; porém, nada muito significativo.", limit: 100 },
      { news: "raichu", limit: 1000 },
      { news: "riolu", limit: 5000 },
      { news: "lucario", limit: 10000 },
    ],

    generateNews() {
      const totalCookies = game.player.cookieStats.Earned;
      const regularNews = [
        { news: "lorem default 1", limit: 0 },
        { news: "lorem default 2", limit: 0 },
      ];
      const milestoneNews = [{ news: "magmortar", limit: 0 }];
      this.defaultNewsArray.forEach((el) => {
        if (el.limit <= totalCookies) {
          regularNews.push(el);
        }
      });
      this.milestoneNewsArray.forEach((el) => {
        if (el.limit <= totalCookies) {
          milestoneNews.push(el);
        }
      });
      // 3 - 2 (being both milestone the same entry)
      enabledNews = [
        regularNews[regularNews.length - 1],
        regularNews[regularNews.length - 2],
        milestoneNews[milestoneNews.length - 1],
      ];
      return enabledNews;
    },
  },

  handleStatsToggle(currentListElement) {
    listElements = document.getElementsByClassName("status-label");
    for (let i = 0; i < listElements.length; i++) {
      const currentListItem = document.getElementById(
        `${listElements[i].className.split(" ")[1]}-list`
      );
      currentListItem.id === currentListElement.id
        ? currentListItem.id === "status-list"
          ? (currentListItem.style = "display: flex")
          : (currentListItem.style = "display : block")
        : (currentListItem.style = "display: none");
    }
  },

  handleMenuChange() {
    const elements = document.getElementsByClassName("status-label");

    for (let i = 0; i < elements.length; i++) {
      elements[i].addEventListener("click", () => {
        const currentListElement = document.getElementById(
          `${elements[i].className.split(" ")[1]}-list`
        );
        this.handleStatsToggle(currentListElement);
      });
    }
  },

  buildings: [
    // Generate all buildings here
    new Building(
      "Voluntário",
      15,
      0.1,
      [
        new Upgrade(
          "Luvas reforçadas",
          100,
          "Voluntários e a geração de PI por clique são duas vezes mais eficientes",
          1
        ),
        new Upgrade(
          "Carrinho de mão robusto",
          500,
          "Voluntários e a geração de PI por clique são duas vezes mais eficientes",
          1
        ),
        new Upgrade(
          "Rede de coleta comunitária",
          10000,
          "Voluntários e a geração de PI por clique são duas vezes mais eficientes",
          10
        ),
        new Upgrade(
          "Veículo de coleta",
          100000,
          "Voluntários ganham +0.1 pontos de impacto por cada infraestrutura diferente de voluntário financiada",
          25,
          0.1
        ),
        new Upgrade(
          "Parceria com ONGs",
          10000000,
          "Voluntários ganham +0.5 pontos de impacto por cada building não voluntário",
          50,
          0.5
        ),
        new Upgrade(
          "Caminhão de coleta automatizado",
          100000000,
          "Voluntários ganham +5 pontos de impacto por cada building não voluntário",
          100,
          5
        ),
        new Upgrade(
          "Programa de reciclagem",
          1000000000,
          "Voluntários ganham +50 pontos de impacto por cada building não voluntário",
          150,
          50
        ),
        new Upgrade(
          "Educação ambiental nas escolas",
          10000000000,
          "Voluntários ganham +500 pontos de impacto por cada building não voluntário",
          200,
          500
        ),
      ],
      false
    ),

    new Building("Mini usina hidrelétrica", 100, 1, [
      new Upgrade(
        "Turbinas eficientes",
        1000,
        "Mini usinas hidrelétricas são duas vezes mais eficientes",
        1
      ),
      new Upgrade(
        "Geradores reforçados",
        5000,
        "Mini usinas hidrelétricas são duas vezes mais eficientes",
        5
      ),
      new Upgrade(
        "Sistema de controle automático",
        50000,
        "Mini usinas hidrelétricas são duas vezes mais eficientes",
        25
      ),
      new Upgrade(
        "Captação de água de chuva",
        5000000,
        "Mini usinas hidrelétricas são duas vezes mais eficientes",
        50
      ),
      new Upgrade(
        "Filtro de sedimentos avançado",
        500000000,
        "Mini usinas hidrelétricas são duas vezes mais eficientes",
        100
      ),
      new Upgrade(
        "Desvio para peixes migratórios",
        50000000000,
        "Mini usinas hidrelétricas são duas vezes mais eficientes",
        150
      ),
      new Upgrade(
        "Armazenamento de energia renovável",
        50000000000000,
        "Mini usinas hidrelétricas são duas vezes mais eficientes",
        200
      ),
      new Upgrade(
        "Monitoramento remoto",
        50000000000000000,
        "Mini usinas hidrelétricas são duas vezes mais eficientes",
        250
      ),
    ]),

    new Building("Fossa séptica biodigestora", 1100, 8, [
      new Upgrade(
        "Filtro de efluentes",
        11000,
        "Fossas sépticas biodigestoras são duas vezes mais eficientes",
        1
      ),
      new Upgrade(
        "Sistema de ventilação aprimorado",
        55000,
        "Fossas sépticas biodigestoras são duas vezes mais eficientes",
        5
      ),
      new Upgrade(
        "Câmaras de biogás",
        550000,
        "Fossas sépticas biodigestoras são duas vezes mais eficientes",
        25
      ),
      new Upgrade(
        "Tratamento de resíduos avançado",
        55000000,
        "Fossas sépticas biodigestoras são duas vezes mais eficientes",
        50
      ),
      new Upgrade(
        "Barreira contra poluentes",
        5500000000,
        "Fossas sépticas biodigestoras são duas vezes mais eficientes",
        100
      ),
      new Upgrade(
        "Alerta automático de manutenção",
        550000000000,
        "Fossas sépticas biodigestoras são duas vezes mais eficientes",
        150
      ),
      new Upgrade(
        "Redução de odores",
        550000000000000,
        "Fossas sépticas biodigestoras são duas vezes mais eficientes",
        200
      ),
      new Upgrade(
        "Reaproveitamento de biogás",
        550000000000000000,
        "Fossas sépticas biodigestoras são duas vezes mais eficientes",
        250
      ),
    ]),

    new Building("Centro de compostagem", 12000, 47, [
      new Upgrade(
        "Triturador de resíduos orgânicos",
        120000,
        "Centros de compostagem são duas vezes mais eficientes",
        1
      ),
      new Upgrade(
        "Vermicompostagem",
        600000,
        "Centros de compostagem são duas vezes mais eficientes",
        5
      ),
      new Upgrade(
        "Estufas de compostagem",
        6000000,
        "Centros de compostagem são duas vezes mais eficientes",
        25
      ),
      new Upgrade(
        "Sistema de irrigação automático",
        600000000,
        "Centros de compostagem são duas vezes mais eficientes",
        50
      ),
      new Upgrade(
        "Termômetros de compostagem",
        60000000000,
        "Centros de compostagem são duas vezes mais eficientes",
        100
      ),
      new Upgrade(
        "Rede de coleta de orgânicos",
        6000000000000,
        "Centros de compostagem são duas vezes mais eficientes",
        150
      ),
      new Upgrade(
        "Composteiras comunitárias",
        6000000000000000,
        "Centros de compostagem são duas vezes mais eficientes",
        200
      ),
      new Upgrade(
        "Parcerias com hortas comunitárias",
        6000000000000000000,
        "Centros de compostagem são duas vezes mais eficientes",
        250
      ),
    ]),

    new Building("Satélite", 130000, 260, [
      new Upgrade(
        "Sensores de desmatamento",
        1300000,
        "Satélites são duas vezes mais eficientes",
        1
      ),
      new Upgrade(
        "Monitoramento de fauna e flora",
        6500000,
        "Satélites são duas vezes mais eficientes",
        5
      ),
      new Upgrade(
        "Mapeamento de qualidade da água",
        65000000,
        "Satélites são duas vezes mais eficientes",
        25
      ),
      new Upgrade(
        "Previsão de desastres naturais",
        6500000000,
        "Satélites são duas vezes mais eficientes",
        50
      ),
      new Upgrade(
        "Aprimoramento de imagens satelitais",
        650000000000,
        "Satélites são duas vezes mais eficientes",
        100
      ),
      new Upgrade(
        "Energia solar para satélites",
        65000000000000,
        "Satélites são duas vezes mais eficientes",
        150
      ),
      new Upgrade(
        "Comunicação com comunidades isoladas",
        65000000000000000,
        "Satélites são duas vezes mais eficientes",
        200
      ),
      new Upgrade(
        "Rede de sensoriamento remoto",
        65000000000000000000,
        "Satélites são duas vezes mais eficientes",
        250
      ),
    ]),

    new Building("Painel solar", 1400000, 1400, [
      new Upgrade(
        "Painéis solares de alta eficiência",
        14000000,
        "Painéis solares são duas vezes mais eficientes",
        1
      ),
      new Upgrade(
        "Baterias de longa duração",
        70000000,
        "Painéis solares são duas vezes mais eficientes",
        5
      ),
      new Upgrade(
        "Inversores de energia avançados",
        700000000,
        "Painéis solares são duas vezes mais eficientes",
        25
      ),
      new Upgrade(
        "Seguidores solares",
        70000000000,
        "Painéis solares são duas vezes mais eficientes",
        50
      ),
      new Upgrade(
        "Revestimento antirreflexo",
        7000000000000,
        "Painéis solares são duas vezes mais eficientes",
        100
      ),
      new Upgrade(
        "Manutenção automatizada",
        700000000000000,
        "Painéis solares são duas vezes mais eficientes",
        150
      ),
      new Upgrade(
        "Materiais reciclados",
        700000000000000000,
        "Painéis solares são duas vezes mais eficientes",
        200
      ),
      new Upgrade(
        "Expansão para escolas comunitárias",
        700000000000000000000,
        "Painéis solares são duas vezes mais eficientes",
        250
      ),
    ]),
    new Building("Sistema Agroflorestal", 330000000, 44000, [
      new Upgrade(
        "Sombreamento ideal",
        3300000000,
        "Sistemas agroflorestais são duas vezes mais eficientes",
        1
      ),
      new Upgrade(
        "Consórcio produtivo",
        16500000000,
        "Sistemas agroflorestais são duas vezes mais eficientes",
        5
      ),
      new Upgrade(
        "Solo saudável",
        165000000000,
        "Sistemas agroflorestais são duas vezes mais eficientes",
        25
      ),
      new Upgrade(
        "Tecnologia sustentável",
        16500000000000,
        "Sistemas agroflorestais são duas vezes mais eficientes",
        50
      ),
      new Upgrade(
        "Planejamento agroecológico",
        1650000000000000,
        "Sistemas agroflorestais são duas vezes mais eficientes",
        100
      ),
      new Upgrade(
        "Biodiversidade",
        165000000000000000,
        "Sistemas agroflorestais são duas vezes mais eficientes",
        150
      ),
      new Upgrade(
        "Sequestro de carbono",
        165000000000000000000,
        "Sistemas agroflorestais são duas vezes mais eficientes",
        200
      ),
      new Upgrade(
        "Manejo integrado",
        165000000000000000000000,
        "Sistemas agroflorestais são duas vezes mais eficientes",
        250
      ),
      new Upgrade(
        "Inovações verdes",
        165000000000000000000000000,
        "Sistemas agroflorestais são duas vezes mais eficientes",
        300
      ),
      new Upgrade(
        "Diversificação de culturas",
        165000000000000000000000000000,
        "Sistemas agroflorestais são duas vezes mais eficientes",
        350
      ),
      new Upgrade(
        "Soluções climáticas",
        1650000000000000000000000000000000,
        "Sistemas agroflorestais são duas vezes mais eficientes",
        400
      ),
    ]),

    // new Building("Shipment", 5100000000, 260000, [
    //   new Upgrade(
    //     "Vanilla nebulae",
    //     51000000000,
    //     "Shipments are twice as efficient",
    //     1
    //   ),
    //   new Upgrade(
    //     "Wormholes",
    //     255000000000,
    //     "Shipments are twice as efficient",
    //     5
    //   ),
    //   new Upgrade(
    //     "Frequent flyer",
    //     2550000000000,
    //     "Shipments are twice as efficient",
    //     25
    //   ),
    //   new Upgrade(
    //     "Warp drive",
    //     255000000000000,
    //     "Shipments are twice as efficient",
    //     50
    //   ),
    //   new Upgrade(
    //     "Chocolate monoliths",
    //     25500000000000000,
    //     "Shipments are twice as efficient",
    //     100
    //   ),
    //   new Upgrade(
    //     "Generation ship",
    //     2550000000000000000,
    //     "Shipments are twice as efficient",
    //     150
    //   ),
    //   new Upgrade(
    //     "Dyson sphere",
    //     2550000000000000000000,
    //     "Shipments are twice as efficient",
    //     200
    //   ),
    //   new Upgrade(
    //     "The final frontier",
    //     2550000000000000000000000,
    //     "Shipments are twice as efficient",
    //     250
    //   ),
    //   new Upgrade(
    //     "Autopilot",
    //     2550000000000000000000000000,
    //     "Shipments are twice as efficient",
    //     300
    //   ),
    //   new Upgrade(
    //     "Restaurants at the end of the universe",
    //     2550000000000000000000000000000,
    //     "Shipments are twice as efficient",
    //     350
    //   ),
    //   new Upgrade(
    //     "Universal alphabet",
    //     25500000000000000000000000000000000,
    //     "Shipments are twice as efficient",
    //     400
    //   ),
    // ]),
    // new Building("Alchemy Lab", 75000000000, 1500000, [
    //   new Upgrade(
    //     "Antimony",
    //     750000000000,
    //     "Alchemy labs are twice as efficient",
    //     1
    //   ),
    //   new Upgrade(
    //     "Essence of dough",
    //     3750000000000,
    //     "Alchemy labs are twice as efficient",
    //     5
    //   ),
    //   new Upgrade(
    //     "True chocolate",
    //     37500000000000,
    //     "Alchemy labs are twice as efficient",
    //     25
    //   ),
    //   new Upgrade(
    //     "Ambrosia",
    //     3750000000000000,
    //     "Alchemy labs are twice as efficient",
    //     50
    //   ),
    //   new Upgrade(
    //     "Aqua crustulae",
    //     375000000000000000,
    //     "Alchemy labs are twice as efficient",
    //     100
    //   ),
    //   new Upgrade(
    //     "Origin crucible",
    //     37500000000000000000,
    //     "Alchemy labs are twice as efficient",
    //     150
    //   ),
    //   new Upgrade(
    //     "Theory of atomic fluidity",
    //     37500000000000000000000,
    //     "Alchemy labs are twice as efficient",
    //     200
    //   ),
    //   new Upgrade(
    //     "Beige goo",
    //     37500000000000000000000000,
    //     "Alchemy labs are twice as efficient",
    //     250
    //   ),
    //   new Upgrade(
    //     "The advent of chemistry",
    //     37500000000000000000000000000,
    //     "Alchemy labs are twice as efficient",
    //     300
    //   ),
    //   new Upgrade(
    //     "On second thought",
    //     37500000000000000000000000000000,
    //     "Alchemy labs are twice as efficient",
    //     350
    //   ),
    //   new Upgrade(
    //     "Public betterment",
    //     375000000000000000000000000000000000,
    //     "Alchemy labs are twice as efficient",
    //     400
    //   ),
    // ]),
    // new Building("Portal", 1000000000000, 10000000, [
    //   new Upgrade(
    //     "Ancient tablet",
    //     10000000000000,
    //     "Portals are twice as efficient",
    //     1
    //   ),
    //   new Upgrade(
    //     "Insane oatling workers",
    //     50000000000000,
    //     "Portals are twice as efficient",
    //     5
    //   ),
    //   new Upgrade(
    //     "Soul bond",
    //     500000000000000,
    //     "Portals are twice as efficient",
    //     25
    //   ),
    //   new Upgrade(
    //     "Sanity dance",
    //     50000000000000000,
    //     "Portals are twice as efficient",
    //     50
    //   ),
    //   new Upgrade(
    //     "Brane transplant",
    //     5000000000000000000,
    //     "Portals are twice as efficient",
    //     100
    //   ),
    //   new Upgrade(
    //     "Deity-sized portals",
    //     500000000000000000000,
    //     "Portals are twice as efficient",
    //     150
    //   ),
    //   new Upgrade(
    //     "End of times back-up plan",
    //     500000000000000000000000,
    //     "Portals are twice as efficient",
    //     200
    //   ),
    //   new Upgrade(
    //     "Maddening chants",
    //     500000000000000000000000000,
    //     "Portals are twice as efficient",
    //     250
    //   ),
    //   new Upgrade(
    //     "The real world",
    //     500000000000000000000000000000,
    //     "Portals are twice as efficient",
    //     300
    //   ),
    //   new Upgrade(
    //     "Dimensional garbage gulper",
    //     500000000000000000000000000000000,
    //     "Portals are twice as efficient",
    //     350
    //   ),
    //   new Upgrade(
    //     "Embedded microportals",
    //     5000000000000000000000000000000000000,
    //     "Portals are twice as efficient",
    //     400
    //   ),
    // ]),
    // new Building("Time Machine", 14000000000000, 65000000, [
    //   new Upgrade(
    //     "Flux capacitors",
    //     140000000000000,
    //     "Time machines are twice as efficient",
    //     1
    //   ),
    //   new Upgrade(
    //     "Time paradox resolver",
    //     700000000000000,
    //     "Time machines are twice as efficient",
    //     5
    //   ),
    //   new Upgrade(
    //     "Quantum conundrum",
    //     7000000000000000,
    //     "Time machines are twice as efficient",
    //     25
    //   ),
    //   new Upgrade(
    //     "Causality enforcer",
    //     700000000000000000,
    //     "Time machines are twice as efficient",
    //     50
    //   ),
    //   new Upgrade(
    //     "Yestermorrow comparators",
    //     70000000000000000000,
    //     "Time machines are twice as efficient",
    //     100
    //   ),
    //   new Upgrade(
    //     "Far future enactment",
    //     7000000000000000000000,
    //     "Time machines are twice as efficient",
    //     150
    //   ),
    //   new Upgrade(
    //     "Great loop hypothesis",
    //     7000000000000000000000000,
    //     "Time machines are twice as efficient",
    //     200
    //   ),
    //   new Upgrade(
    //     "Cookietopian moments of maybe",
    //     7000000000000000000000000000,
    //     "Time machines are twice as efficient",
    //     250
    //   ),
    //   new Upgrade(
    //     "Second seconds",
    //     7000000000000000000000000000000,
    //     "Time machines are twice as efficient",
    //     300
    //   ),
    //   new Upgrade(
    //     "Additional clock hands",
    //     7000000000000000000000000000000000,
    //     "Time machines are twice as efficient",
    //     350
    //   ),
    //   new Upgrade(
    //     "Nostalgia",
    //     70000000000000000000000000000000000000,
    //     "Time machines are twice as efficient",
    //     400
    //   ),
    // ]),
    // new Building("Antimatter Condenser", 170000000000000, 430000000, [
    //   new Upgrade(
    //     "Sugar bosons",
    //     1700000000000000,
    //     "Antimatter condensers are twice as efficient",
    //     1
    //   ),
    //   new Upgrade(
    //     "String theory",
    //     8500000000000000,
    //     "Antimatter condensers are twice as efficient",
    //     5
    //   ),
    //   new Upgrade(
    //     "Large macaron collider",
    //     85000000000000000,
    //     "Antimatter condensers are twice as efficient",
    //     25
    //   ),
    //   new Upgrade(
    //     "Big bang bake",
    //     8500000000000000000,
    //     "Antimatter condensers are twice as efficient",
    //     50
    //   ),
    //   new Upgrade(
    //     "Reverse cyclotrons",
    //     850000000000000000000,
    //     "Antimatter condensers are twice as efficient",
    //     100
    //   ),
    //   new Upgrade(
    //     "Nanocosmics",
    //     85000000000000000000000,
    //     "Antimatter condensers are twice as efficient",
    //     150
    //   ),
    //   new Upgrade(
    //     "The Pulse",
    //     85000000000000000000000000,
    //     "Antimatter condensers are twice as efficient",
    //     200
    //   ),
    //   new Upgrade(
    //     "Some other super-tiny fundamental particle? Probably?",
    //     85000000000000000000000000000,
    //     "Antimatter condensers are twice as efficient",
    //     250
    //   ),
    //   new Upgrade(
    //     "Quantum comb",
    //     85000000000000000000000000000000,
    //     "Antimatter condensers are twice as efficient",
    //     300
    //   ),
    //   new Upgrade(
    //     "Baking Nobel prize",
    //     85000000000000000000000000000000000,
    //     "Antimatter condensers are twice as efficient",
    //     350
    //   ),
    //   new Upgrade(
    //     "The definite molecule",
    //     850000000000000000000000000000000000000,
    //     "Antimatter condensers are twice as efficient",
    //     400
    //   ),
    // ]),
    // new Building("Prism", 2100000000000000, 2900000000, [
    //   new Upgrade(
    //     "Gem polish",
    //     21000000000000000,
    //     "Prims are twice as efficient",
    //     1
    //   ),
    //   new Upgrade(
    //     "9th color",
    //     105000000000000000,
    //     "Prims are twice as efficient",
    //     5
    //   ),
    //   new Upgrade(
    //     "Chocolate light",
    //     1050000000000000000,
    //     "Prims are twice as efficient",
    //     25
    //   ),
    //   new Upgrade(
    //     "Grainbow",
    //     105000000000000000000,
    //     "Prims are twice as efficient",
    //     50
    //   ),
    //   new Upgrade(
    //     "Pure cosmic light",
    //     10500000000000000000000,
    //     "Prims are twice as efficient",
    //     100
    //   ),
    //   new Upgrade(
    //     "Glow-in-the-dark",
    //     1050000000000000000000000,
    //     "Prims are twice as efficient",
    //     150
    //   ),
    //   new Upgrade(
    //     "Lux sanctorum",
    //     1050000000000000000000000000,
    //     "Prims are twice as efficient",
    //     200
    //   ),
    //   new Upgrade(
    //     "Reverse shadows",
    //     1050000000000000000000000000000,
    //     "Prims are twice as efficient",
    //     250
    //   ),
    //   new Upgrade(
    //     "Crystal mirrors",
    //     1050000000000000000000000000000000,
    //     "Prims are twice as efficient",
    //     300
    //   ),
    //   new Upgrade(
    //     "Reverse theory of light",
    //     1050000000000000000000000000000000000,
    //     "Prisms are twice as efficient",
    //     350
    //   ),
    //   new Upgrade(
    //     "Light capture measures",
    //     10500000000000000000000000000000000000000,
    //     "Prisms are twice as efficient",
    //     400
    //   ),
    // ]),
    // new Building("Chancemaker", 26000000000000000, 21000000000, [
    //   new Upgrade(
    //     "Your lucky cookie",
    //     260000000000000000,
    //     "Chancemakers are twice as efficient",
    //     1
    //   ),
    //   new Upgrade(
    //     "'All Bets Are Off' magic coin",
    //     130000000000000000,
    //     "Chancemakers are twice as efficient",
    //     5
    //   ),
    //   new Upgrade(
    //     "Winning lottery ticket",
    //     13000000000000000000,
    //     "Chancemakers are twice as efficient",
    //     25
    //   ),
    //   new Upgrade(
    //     "Four-leaf clover field",
    //     130000000000000000000,
    //     "Chancemakers are twice as efficient",
    //     50
    //   ),
    //   new Upgrade(
    //     "A recipe book about books",
    //     13000000000000000000000,
    //     "Chancemakers are twice as efficient",
    //     100
    //   ),
    //   new Upgrade(
    //     "Leprechaun village",
    //     13000000000000000000000000,
    //     "Chancemakers are twice as efficient",
    //     150
    //   ),
    //   new Upgrade(
    //     "Improbability drive",
    //     13000000000000000000000000000,
    //     "Chancemakers are twice as efficient",
    //     200
    //   ),
    //   new Upgrade(
    //     "Antisuperstistronics",
    //     13000000000000000000000000000000,
    //     "Chancemakers are twice as efficient",
    //     250
    //   ),
    //   new Upgrade(
    //     "Bunnypedes",
    //     13000000000000000000000000000000000,
    //     "Chancemakers are twice as efficient",
    //     300
    //   ),
    //   new Upgrade(
    //     "Revised probalistics",
    //     13000000000000000000000000000000000000,
    //     "Chancemakers are twice as efficient",
    //     350
    //   ),
    //   new Upgrade(
    //     "0-sided dice",
    //     130000000000000000000000000000000000000000,
    //     "Chancemakers are twice as efficient",
    //     400
    //   ),
    // ]),
    // new Building("Fractal Engine", 310000000000000000, 150000000000, [
    //   new Upgrade(
    //     "Metabakeries",
    //     3100000000000000000,
    //     "Fractal engines are twice as efficient",
    //     1
    //   ),
    //   new Upgrade(
    //     "Mandelbrown sugar",
    //     15500000000000000000,
    //     "Fractal engines are twice as efficient",
    //     5
    //   ),
    //   new Upgrade(
    //     "Fractoids",
    //     155000000000000000000,
    //     "Fractal engines are twice as efficient",
    //     25
    //   ),
    //   new Upgrade(
    //     "Nested universe theory",
    //     15500000000000000000000,
    //     "Fractal engines are twice as efficient",
    //     50
    //   ),
    //   new Upgrade(
    //     "Menger sponge cake",
    //     1550000000000000000000000,
    //     "Fractal engines are twice as efficient",
    //     100
    //   ),
    //   new Upgrade(
    //     "One particularly good-humoured cow",
    //     155000000000000000000000000,
    //     "Fractal engines are twice as efficient",
    //     150
    //   ),
    //   new Upgrade(
    //     "Chocolate ouroboros",
    //     155000000000000000000000000000,
    //     "Fractal engines are twice as efficient",
    //     200
    //   ),
    //   new Upgrade(
    //     "Nested",
    //     155000000000000000000000000000000,
    //     "Fractal engines are twice as efficient",
    //     250
    //   ),
    //   new Upgrade(
    //     "Space-filling fibers",
    //     155000000000000000000000000000000000,
    //     "Fractal engines are twice as efficient",
    //     300
    //   ),
    //   new Upgrade(
    //     "Endless book of prose",
    //     155000000000000000000000000000000000000,
    //     "Fractal engines are twice as efficient",
    //     350
    //   ),
    //   new Upgrade(
    //     "The set of all sets",
    //     1550000000000000000000000000000000000000000,
    //     "Fractal engines are twice as efficient",
    //     400
    //   ),
    // ]),
    // new Building("Java Console", 71000000000000000000, 1100000000000, [
    //   new Upgrade(
    //     "The JavaScript console for dummies",
    //     710000000000000000000,
    //     "Java consoles are twice as efficient",
    //     1
    //   ),
    //   new Upgrade(
    //     "64bit Arrays",
    //     3550000000000000000000,
    //     "Java consoles are twices as efficient",
    //     5
    //   ),
    //   new Upgrade(
    //     "Stack overflow",
    //     35500000000000000000000,
    //     "Java consoles are twice as efficient",
    //     25
    //   ),
    //   new Upgrade(
    //     "Enterprise compiler",
    //     3550000000000000000000000,
    //     "Java consoles are twice as efficient",
    //     50
    //   ),
    //   new Upgrade(
    //     "Syntactic sugar",
    //     355000000000000000000000000,
    //     "Java consoles are twice as efficient",
    //     100
    //   ),
    //   new Upgrade(
    //     "A nice cup of coffee",
    //     35500000000000000000000000000,
    //     "Java consoles are twice as efficient",
    //     150
    //   ),
    //   new Upgrade(
    //     "Just-in-time baking",
    //     35500000000000000000000000000000,
    //     "Java consoles are twice as efficient",
    //     200
    //   ),
    //   new Upgrade(
    //     "cookies++",
    //     35500000000000000000000000000000000,
    //     "Java consoles are twice as efficient",
    //     250
    //   ),
    //   new Upgrade(
    //     "Software updates",
    //     35500000000000000000000000000000000000,
    //     "Java consoles are twice as efficient",
    //     300
    //   ),
    //   new Upgrade(
    //     "Game.Loop",
    //     35500000000000000000000000000000000000000,
    //     "Java consoles are twice as efficient",
    //     350
    //   ),
    //   new Upgrade(
    //     "eval()",
    //     355000000000000000000000000000000000000000000,
    //     "Java consoles are twice as efficient",
    //     400
    //   ),
    // ]),
  ],
  utilities: {
    ShortNumbers: [
      "K",
      "M",
      "B",
      "T",
      "Qua",
      "Qui",
      "Sex",
      "Sep",
      "Oct",
      "Non",
      "Dec",
      "Und",
      "Duo",
      "Tre",
      "QuaD",
      "QuiD",
      "SexD",
      "SepD",
      "OctD",
      "NonD",
      "Vig",
    ],
    updateText(className, text) {
      let elements = document.getElementsByClassName(className);
      for (var i in elements) {
        elements[i].innerHTML = text;
      }
    },
    formatNumber(number) {
      let formatted = "";
      if (number >= 1000) {
        for (let i = 0; i < game.utilities.ShortNumbers.length; i++) {
          let divider = Math.pow(10, (i + 1) * 3);
          if (number >= divider) {
            formatted =
              (Math.trunc((number / divider) * 1000) / 1000).toFixed(3) +
              " " +
              game.utilities.ShortNumbers[i];
          }
        }
        return formatted;
      }
      return (Math.trunc(number * 10) / 10).toFixed(1);
    },
    getAchievementRelation() {
      let enabledAc = 0;
      game.achievements.forEach((ac) => {
        if (ac.status == "enabled") {
          enabledAc += 1;
        }
      });
      return { enabledAc, totalAc: game.achievements.length };
    },
    getBuildingByName(name) {
      let correctBuilding = null;
      game.buildings.forEach((building) => {
        if (building.name == name) {
          correctBuilding = building;
          return;
        }
      });
      return correctBuilding;
    },
    printBuildings() {
      game.buildings.forEach((b) => {
        console.log(b);
      });
    },
    getBuildingIndexByName(name) {
      for (let i = 0; i < game.buildings.length - 1; i++) {
        let curBuilding = game.buildings[i];
        if (curBuilding.name == name) {
          return i;
        }
      }
    },
    getBuildingCount() {
      let amount = 0;
      game.buildings.forEach((building) => {
        amount += building.amount;
      });
      return amount;
    },
    stringToBool(string) {
      switch (string) {
        case "true":
          return true;
        case "false":
          return false;
      }
    },
  },
  saving: {
    export() {
      let saveString = "";
      saveString += `${game.player.cookies}|${game.player.cookieStats.Earned}|${game.player.cookieStats.Spent}|${game.player.cookieStats.Clicked}-`;
      let first = true;
      game.buildings.forEach((building) => {
        if (first) {
          first = false;
          saveString += `${building.amount}|${building.locked}|`;
        } else {
          saveString += `#${building.amount}|${building.locked}|`;
        }
        building.upgrades.forEach((upgrade) => {
          saveString += `${upgrade.owned}:`;
        });
        saveString = saveString.slice(0, -1);
      });
      game.saving.saveToCache(premagic(saveString));
      return premagic(saveString);
    },
    import(saveString) {
      saveString = magic(saveString);
      if (saveString != false) {
        saveString = saveString.split("-");
        game.saving.loadPlayer(saveString[0]);
        game.saving.loadBuildings(saveString[1]);
        game.settings.recalculateCPS = true;
        game.updateShop(game.currentShop);
      } else {
        alert(
          "Something wasn't quite right there, unfortunately your save could not be loaded."
        );
      }
    },
    saveToCache(saveString) {
      try {
        return window.localStorage.setItem(game.settings.key, saveString);
      } catch {
        console.log("Problem saving to cache");
      }
    },
    getSaveFromCache() {
      try {
        return window.localStorage.getItem(game.settings.key);
      } catch {
        console.log("Problem loading data from cache, probably doesn't exist");
      }
    },
    loadPlayer(playerData) {
      playerData = playerData.split("|");
      try {
        game.player.cookies = parseFloat(playerData[0]);
        game.player.cookieStats.Earned = parseFloat(playerData[1]);
        game.player.cookieStats.Spent = parseFloat(playerData[2]);
        game.player.cookieStats.Clicked = parseFloat(playerData[3]);
      } catch {
        console.log(
          "Something went wrong whilst loading player data, likely from an older version and not to worry."
        );
      }
    },
    loadBuildings(buildingData) {
      buildingData = buildingData.split("#");
      try {
        for (let i = 0; i < game.buildings.length; i++) {
          let savedBuilding = buildingData[i];
          let nonUpgrade = savedBuilding.split("|");
          let building = game.buildings[i];
          building.amount = parseFloat(nonUpgrade[0]);
          building.setCost();
          building.locked = game.utilities.stringToBool(nonUpgrade[1]);
          let j = 0;
          let upgrades = nonUpgrade[2].split(":");
          building.upgrades.forEach((upgrade) => {
            upgrade.owned = game.utilities.stringToBool(upgrades[j]);
            j++;
          });
        }
      } catch {
        console.log(
          "Something went wrong whilst loading building data, likely from an older version and not to worry."
        );
      }
    },
    // loadAchievements
    wipeSave() {
      if (
        confirm(
          "Are you sure you want to wipe your save? This cannot be reversed!"
        )
      ) {
        game.player.cookies = 0;
        game.player.cookieStats.Earned = 0;
        game.player.cookieStats.Spent = 0;
        game.player.cookieStats.Clicked = 0;
        game.buildings.forEach((building) => {
          if (building.name != "Voluntário") {
            building.locked = true;
          }
          building.amount = 0;
          building.effect = 0;
          building.specialCPS = 0;
          building.setCost();
          for (var i in building.upgrades) {
            building.upgrades[i].owned = false;
          }
        });
        game.constructShop();
        game.updateShop("Voluntário");
        game.settings.recalculateCPS = true;
      }
    },
    importing: false,
    openBox(type) {
      let container = document.getElementsByClassName("importExportBox")[0];
      let box = document.getElementById("saveBox");
      switch (type) {
        case "import":
          this.importing = true;
          container.style.visibility = "visible";
          box.removeAttribute("readonly");
          box.value = "";
          return;
        case "export":
          let saveString = this.export();
          container.style.visibility = "visible";
          box.value = saveString;
          box.setAttribute("readonly", true);
          return;
      }
    },
    closeBox() {
      document.getElementsByClassName("importExportBox")[0].style.visibility =
        "hidden";
      if (this.importing) {
        let box = document.getElementById("saveBox");
        this.import(box.value);
        box.value = "";
      }
    },
  },
  player: new Player(),
  upgradeHall: new UpgradeHall(),
  giveCookies(num) {
    this.player.earnCookie(num);
  },
  images: {
    stages: [
      { limit: 10, image: "./images/left-background/1.png" },
      { limit: 20, image: "./images/left-background/2.png" },
      { limit: 30, image: "./images/left-background/3.png" },
      { limit: 5000, image: "./images/left-background/4.png" },
      { limit: 10000, image: "./images/left-background/5.png" },
    ],
    handleImageChange() {
      const imageContainer = document.getElementById("left-background");
      const currentCookies = game.player.cookieStats.Earned;
      if(this.stages[0].limit < currentCookies && this.stages[0].limit !== 10000) {
        this.stages.shift()
        imageContainer.src = this.stages[0].image;
      }
    },
  },
  logic: {
    newsLogic() {
      setInterval(() => {
        game.updateDisplays("enabled");
        game.challengeActions.handleChallengePopUpTrigger()
      }, 3000);
    },

    updateLogic() {
      setInterval(() => {
        game.totalCookiesAchievementTriggerListener();
      }, 1000);
    },

    clickAndShopLogic() {
      game.updateDisplays();
      // Only recalculate it when needed, saves on some processing power because this can turn out to be quite a lot of maths.
      if (game.settings.recalculateCPS == true) {
        let CPS = 0;
        game.buildings.forEach((building) => {
          CPS += building.getCPS();
        });
        game.settings.recalculateCPS = false;
        game.player.aMPF = CPS / game.settings.frameRate;
        game.updateShop(game.currentShop);
        game.upgradeHall.updateUpgradeHallHTML()
        console.log('update')
      }
      if (document.hasFocus()) {
        game.player.earnCookie(game.player.aMPF);
        game.saving.export();
        setTimeout(
          game.logic.clickAndShopLogic,
          1000 / game.settings.frameRate
        );
      } else {
        game.player.earnCookie(game.player.aMPF * game.settings.frameRate);
        game.saving.export();
        setTimeout(game.logic.clickAndShopLogic, 1000);
      }
    },
  },
  updateDisplays(enableNews) {
    // Create temporary shorthand aliases for ease of use.
    let updateText = game.utilities.updateText;
    let format = game.utilities.formatNumber;
    let player = game.player;
    let stats = player.cookieStats;
    document.title = "Cookie Clicker | " + format(player.cookies);
    updateText("cookieDisplay", format(player.cookies));
    updateText("cpcDisplay", format(player.aMPC));
    updateText("cpsDisplay", format(player.aMPF * game.settings.frameRate));
    updateText("earnedDisplay", format(stats.Earned));
    updateText("spentDisplay", format(stats.Spent));
    updateText("clickedDisplay", format(stats.Clicked));
    this.images.handleImageChange()
    enableNews === "enabled" && this.constructNews();
  },
  constructNews() {
    const newsArr = game.news.generateNews();
    let currentNews = [];
    if (this.player.cookieStats.Earned === 0) {
      game.utilities.updateText(
        "newsContainer",
        "Clique no botão de doar para começar a fazer a diferença."
      );
    } else {
      newsArr.length > 0
        ? (currentNews = [newsArr[Math.floor(Math.random() * newsArr.length)]])
        : "";
      newsArr.length > 0;
      game.utilities.updateText("newsContainer", currentNews[0].news);
    }
  },
  constructShop() {
    let buildings = game.buildings;
    let finalHtml = "";
    buildings.forEach((building) => {
      if (building.locked == false) {
        finalHtml += building.generateMenuButton();
      }
    });
    game.utilities.updateText("shopList", finalHtml);
  },
  currentShop: "Voluntário",
  updateShop(name) {
    game.currentShop = name;
    let finalHtml = "";
    let building = game.utilities.getBuildingByName(name);
    finalHtml += building.generateShopHTML();
    game.utilities.updateText("shop", finalHtml);
  },

  buyBuilding(name, amount) {
    let building = game.utilities.getBuildingByName(name);
    building.buy(amount);
    this.buildingBuyingAchievementTriggerListener(building);
    console.log(building);
  },
  buyUpgrade(buildingName, upgrade) {
    let building = game.utilities.getBuildingByName(buildingName);
    building.buyUpgrade(upgrade);
  },
  start() {
    // This prevents the user from holding down enter to click the cookie very quickly.
    window.addEventListener("keydown", () => {
      if (event.keyCode == 13 || event.keyCode == 32) {
        event.preventDefault();
        return false;
      }
    });

    // This enables the cookie clicking process.
    document.getElementsByClassName("cookieButton")[0].onclick = () => {
      game.player.clickCookie();
    };
    const newsButton = document.getElementsByClassName("newsContainer")[0];
    newsButton.onclick = () => {
      // Achar o lugar disso
      const newsArr = game.news.generateNews();
      let currentNews = [
        newsArr[Math.floor(Math.random() * newsArr.length)].news,
      ];
      newsButton.innerHTML = currentNews;
    };
    if (game.player.cookieStats.Earned == 15) {
      console.log("it is still running.");
    }

    let localSave = game.saving.getSaveFromCache();
    if (localSave) {
      game.saving.import(localSave);
    } else {
      console.log("No cache save found");
    }

    game.challengeActions.initChallengeRelation();
    game.challengeActions.handleChallengeDisplay();
    game.constructShop();
    game.constructNews();
    game.constructAchievements();
    game.logic.clickAndShopLogic();
    game.logic.newsLogic();
    game.logic.updateLogic();
    game.handleMenuChange();
    game.images.handleImageChange();
  },
};

game.start();
