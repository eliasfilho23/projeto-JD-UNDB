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
    }', 1);">Buy x1</br><b>${format(this.cost)}</b></button>`;
    html += `<button onclick="game.buyBuilding('${
      this.name
    }', 5);">Buy x5</br><b>${format(this.getCost(5))}</b></button>`;
    html += `<button onclick="game.buyBuilding('${
      this.name
    }', 10);">Buy x10</br><b>${format(this.getCost(10))}</b></button>`;
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
            html += `</br><button class="upgNext">Next upgrade in <b>${
              upgrade.limit - this.amount
            }</b> more ${this.name.toLowerCase()}(s)</button>`;
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
              )}</b> ponto(s) de notoriedade.</br>
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
    console.log(buildingStats);
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

  generateHTML() {
    const data = this.returnElAmountBySectionId();
    data &&
      data.forEach((el) => {
        const currentSection = document.getElementById(el.sectionIdAndName);
        const relation = {
          voluntário: "worker",
          miniusinahidrelétrica: "hydroeletric-plant",
          fossasépticabiodigestora: "biodigester",
          centrodecompostagem: "composting-center",
          satélite: "satellite",
          painelsolar: "solar-panel",
          sistemaagroflorestal: "agroforestry-system",
        };
        for (let i = 0; i < el.amount; i++) {
          currentSection.style = "visibility: visible";
          currentSection.childNodes.length !== el.amount
            ? (currentSection.innerHTML += `<img style=' margin-right: 10px; margin-top:75px'
                     src='./images/upgrade-hall-sprites/${
                       relation[
                         el.sectionIdAndName.toLowerCase().split(" ").join("")
                       ]
                     }-sprite.png'
                      alt='${el.sectionIdAndName}'/>`)
            : "";
        }
      });
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
    true: "resposta correta!",
    false: "resposta falsa!",
    alreadyPopped: false,
  },
  {
    limit: 120,
    true: "resposta correta!",
    false: "resposta falsa!",
    alreadyPopped: false,
  },
  {
    limit: 1000,
    true: "resposta correta!",
    false: "resposta falsa!",
    alreadyPopped: false,
  },
  {
    limit: 3000,
    true: "resposta correta!",
    false: "resposta falsa!",
    alreadyPopped: false,
  },
  {
    limit: 5000,
    true: "resposta correta!",
    false: "resposta falsa!",
    alreadyPopped: false,
  },
  {
    limit: 10000,
    true: "resposta correta!",
    false: "resposta falsa!",
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
        challengeDiv.innerHTML = `<div class='challengeDivTitle'>Pergunta numero 1</div>
                <div class='challengeDivContent'>
                   <img class='challengeDivImg' src='images/cookie.png'/>
                   <div class='challengeDivText'>
                       Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam a mi mauris. 
                       Ut sit amet nulla a turpis rhoncus blandit non et eros.
                       Aenean at volutpat sem, non vehicula ex. Donec non enim cursus, 
                       congue arcu ac, scelerisque ante. Ut condimentum vehicula tincidunt.
                       Sed ac fringilla ligula. In lorem ex, blandit eu felis at,
                   condimentum mattis neque. 
                   </div>
               </div>
                <div class='challengeDivButtons'> 
                    <button class='challenge1Btns'>Sim</button>
                    <button class='challenge1Btns'>Não</button>
               </div>
                    `;
        break;
      case 2:
        challengeDiv.innerHTML = `<div class='challengeDivTitle'>Pergunta numero 2</div>
                    <div class='challengeDivContent'>
                    <img class='challengeDivImg' src='images/cookie.png'/>
                    <div class='challengeDivText'>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam a mi mauris. 
                        Ut sit amet nulla a turpis rhoncus blandit non et eros.
                        Aenean at volutpat sem, non vehicula ex. Donec non enim cursus, 
                        congue arcu ac, scelerisque ante. Ut condimentum vehicula tincidunt.
                        Sed ac fringilla ligula. In lorem ex, blandit eu felis at,
                    condimentum mattis neque. 
                    </div>
                </div>
                <div class='challengeDivButtons'>
                   <button class='challenge2Btns'>Opcao 1</button>
                   <button class='challenge2Btns'>Opcao 2</button>
                   <button class='challenge2Btns'>Opcao 3</button>
                   <button class='challenge2Btns'>Opcao 4</button>
                </div>
                `;
        break;
      case 3:
        challengeDiv.innerHTML = `<div class='challengeDivTitle'>Pergunta numero 2</div>
                      <div class='challengeDivContent'>
                      <img class='challengeDivImg' src='images/cookie.png'/>
                      <div class='challengeDivText'>
                          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam a mi mauris. 
                          Ut sit amet nulla a turpis rhoncus blandit non et eros.
                          Aenean at volutpat sem, non vehicula ex. Donec non enim cursus, 
                          congue arcu ac, scelerisque ante. Ut condimentum vehicula tincidunt.
                          Sed ac fringilla ligula. In lorem ex, blandit eu felis at,
                      condimentum mattis neque. 
                      </div>
                  </div>
                  <div class='challengeDivButtons'>
                     <button class='challenge2Btns'>Opcao 1</button>
                     <button class='challenge2Btns'>Opcao 2</button>
                     <button class='challenge2Btns'>Opcao 3</button>
                     <button class='challenge2Btns'>Opcao 4</button>
                  </div>
                  `;
        break;
      case 4:
        challengeDiv.innerHTML = `<div class='challengeDivTitle'>Pergunta numero 2</div>
                        <div class='challengeDivContent'>
                        <img class='challengeDivImg' src='images/cookie.png'/>
                        <div class='challengeDivText'>
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam a mi mauris. 
                            Ut sit amet nulla a turpis rhoncus blandit non et eros.
                            Aenean at volutpat sem, non vehicula ex. Donec non enim cursus, 
                            congue arcu ac, scelerisque ante. Ut condimentum vehicula tincidunt.
                            Sed ac fringilla ligula. In lorem ex, blandit eu felis at,
                        condimentum mattis neque. 
                        </div>
                    </div>
                    <div class='challengeDivButtons'>
                       <button class='challenge2Btns'>Opcao 1</button>
                       <button class='challenge2Btns'>Opcao 2</button>
                       <button class='challenge2Btns'>Opcao 3</button>
                       <button class='challenge2Btns'>Opcao 4</button>
                    </div>
                    `;
        break;
    }
  }

  handleChallengeAnwser(challengeHTML, won, amount) {
    challengeDiv.innerHTML = `
            <div class='challengeDivTitle'>
            ${challengeHTML}
            </div>
            <div class='challengeDivText'>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam a mi mauris. 
                    Ut sit amet nulla a turpis rhoncus blandit non et eros.
                    Aenean at volutpat sem, non vehicula ex. Donec non enim cursus, 
                    congue arcu ac, scelerisque ante. Ut condimentum vehicula tincidunt.
                    Sed ac fringilla ligula. In lorem ex, blandit eu felis at,
                condimentum mattis neque. 
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
              ? (game.player.earnCookie(79),
                this.handleChallengeAnwser(
                  anwserRelationHTML[0].true,
                  true,
                  79
                ))
              : this.handleChallengeAnwser(anwserRelationHTML[0].false);
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
              ? (game.player.earnCookie(79),
                this.handleChallengeAnwser(
                  anwserRelationHTML[1].true,
                  true,
                  79
                ))
              : this.handleChallengeAnwser(anwserRelationHTML[1].false);
          });
        }
        break;
      case 3:
        this.generateChallengeHTML(3);
        const challenge3Btns =
          document.getElementsByClassName("challenge3Btns");
        for (let i = 0; i < challenge2Btns.length; i++) {
          challenge2Btns[i].addEventListener("click", () => {
            i === 1
              ? (game.player.earnCookie(79),
                this.handleChallengeAnwser(
                  anwserRelationHTML[1].true,
                  true,
                  79
                ))
              : this.handleChallengeAnwser(anwserRelationHTML[1].false);
          });
        }
        break;
    }
  }
}
class Achievements {
  achievements = [
    {
      name: "Cookie Amateur",
      status: "disabled",
      description: "Fez 15 cookies",
      trigger: "limit",
      triggerDetail: 15,
    },
    {
      name: "Cookie Enjoyer",
      status: "disabled",
      description: "Fez 20 cookies",
      trigger: "limit",
      triggerDetail: 20,
    },
    {
      name: "Cookie Entrepreneur",
      status: "disabled",
      description: "Fez 50 cookies",
      trigger: "limit",
      triggerDetail: 50,
    },
    {
      name: "Cookie Racist",
      status: "disabled",
      description: "Fez 100 cookies",
      trigger: "limit",
      triggerDetail: 100,
    },
    {
      name: "Cookie Jeffrey Epstein",
      status: "disabled",
      description: "Fez 150 cookies",
      trigger: "limit",
      triggerDetail: 150,
    },
    {
      name: "Cookie Drake Bell",
      status: "disabled",
      description: "Fez 200 cookies",
      trigger: "limit",
      triggerDetail: 200,
    },
    {
      name: "Cookie Drake",
      status: "disabled",
      description: "Fez 500 cookies",
      trigger: "limit",
      triggerDetail: 500,
    },
    {
      name: "Cookie P Diddy",
      status: "disabled",
      description: "Fez 1000 cookies",
      trigger: "limit",
      triggerDetail: 1000,
    },
  ];

  relateAchievementsStatus() {
    let relation = "";
    this.achievements.map((ac) => {
      ac.status === "disabled" ? (relation += "0") : (relation += "1");
    });
    return relation;
  }

  updateAchievementHTML() {
    let finalHtml = "";
    // const currentStatusTitle = document.getElementsByClassName('current-status-label')[0]
    // currentStatusTitle.innerHTML = 'Conquistas'
    this.achievements.forEach((ac) => {
      if (ac.status === "enabled") {
        finalHtml += `<div style='color: white; text-shadow: 3px 3px 10px black;' class='achievement-list-child'>
                    <h3>${ac.name}</h3>
                    <div>${ac.description}</div>
                </div>`;
      }
    });
    game.utilities.updateText("achievements-list", finalHtml);
    this.relateAchievementsStatus();
  }

  achievementTriggerListener() {
    const currentCookies = game.player.cookieStats.Earned;
    this.achievements.forEach((ac) => {
      if (ac.trigger === "limit" && ac.status === "disabled") {
        currentCookies >= ac.triggerDetail
          ? ((ac.status = "enabled"),
            alert(`Conquista desbloqueada:
                         ${ac.name}: ${ac.description}`))
          : "";
      }
    });
    this.updateAchievementHTML();
  }

  constructAchievements() {
    const currentCookies = game.player.cookieStats.Earned;
    this.achievements.forEach((ac) => {
      if (ac.trigger === "limit" && ac.status === "disabled") {
        currentCookies >= ac.triggerDetail ? (ac.status = "enabled") : "";
      }
    });
    this.updateAchievementHTML();
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

  challengeActions: new Challenges(),
  news: {
    defaultNewsArray: [
      { news: "lorem ipsum 1", limit: 10 },
      { news: "lorem ipsum 2", limit: 20 },
      { news: "dolor sit amet 3", limit: 40 },
      { news: "consectetur adipiscing 4", limit: 70 },
      { news: "elit sed do 5", limit: 110 },
      { news: "eiusmod tempor 6", limit: 160 },
      { news: "incididunt ut 7", limit: 220 },
      { news: "labore et dolore 8", limit: 290 },
      { news: "magna aliqua 9", limit: 370 },
      { news: "ut enim ad 10", limit: 460 },
      { news: "minim veniam 11", limit: 560 },
    ],
    milestoneNewsArray: [
      { news: "pikachu", limit: 100 },
      { news: "raichu", limit: 1000 },
      { news: "riolu", limit: 5000 },
      { news: "lucario", limit: 10000 },
    ],

    generateNews() {
      const totalCookies = game.player.cookieStats.Earned;
      const regularNews = [];
      const milestoneNews = [];
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
        regularNews[regularNews.length - 3],
        milestoneNews[milestoneNews.length - 1],
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
          "Voluntários e coleta de lixo são duas vezes mais eficientes",
          1
        ),
        new Upgrade(
          "Carrinho de mão robusto",
          500,
          "Voluntários e coleta de lixo são duas vezes mais eficientes",
          1
        ),
        new Upgrade(
          "Rede de coleta comunitária",
          10000,
          "Voluntários e coleta de lixo são duas vezes mais eficientes",
          10
        ),
        new Upgrade(
          "Veículo de coleta",
          100000,
          "Voluntários ganham +0.1 pontos de notoriedade por cada building não voluntário",
          25,
          0.1
        ),
        new Upgrade(
          "Parceria com ONGs",
          10000000,
          "Voluntários ganham +0.5 pontos de notoriedade por cada building não voluntário",
          50,
          0.5
        ),
        new Upgrade(
          "Caminhão de coleta automatizado",
          100000000,
          "Voluntários ganham +5 pontos de notoriedade por cada building não voluntário",
          100,
          5
        ),
        new Upgrade(
          "Programa de reciclagem",
          1000000000,
          "Voluntários ganham +50 pontos de notoriedade por cada building não voluntário",
          150,
          50
        ),
        new Upgrade(
          "Educação ambiental nas escolas",
          10000000000,
          "Voluntários ganham +500 pontos de notoriedade por cada building não voluntário",
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

    new Building("Shipment", 5100000000, 260000, [
      new Upgrade(
        "Vanilla nebulae",
        51000000000,
        "Shipments are twice as efficient",
        1
      ),
      new Upgrade(
        "Wormholes",
        255000000000,
        "Shipments are twice as efficient",
        5
      ),
      new Upgrade(
        "Frequent flyer",
        2550000000000,
        "Shipments are twice as efficient",
        25
      ),
      new Upgrade(
        "Warp drive",
        255000000000000,
        "Shipments are twice as efficient",
        50
      ),
      new Upgrade(
        "Chocolate monoliths",
        25500000000000000,
        "Shipments are twice as efficient",
        100
      ),
      new Upgrade(
        "Generation ship",
        2550000000000000000,
        "Shipments are twice as efficient",
        150
      ),
      new Upgrade(
        "Dyson sphere",
        2550000000000000000000,
        "Shipments are twice as efficient",
        200
      ),
      new Upgrade(
        "The final frontier",
        2550000000000000000000000,
        "Shipments are twice as efficient",
        250
      ),
      new Upgrade(
        "Autopilot",
        2550000000000000000000000000,
        "Shipments are twice as efficient",
        300
      ),
      new Upgrade(
        "Restaurants at the end of the universe",
        2550000000000000000000000000000,
        "Shipments are twice as efficient",
        350
      ),
      new Upgrade(
        "Universal alphabet",
        25500000000000000000000000000000000,
        "Shipments are twice as efficient",
        400
      ),
    ]),
    new Building("Alchemy Lab", 75000000000, 1500000, [
      new Upgrade(
        "Antimony",
        750000000000,
        "Alchemy labs are twice as efficient",
        1
      ),
      new Upgrade(
        "Essence of dough",
        3750000000000,
        "Alchemy labs are twice as efficient",
        5
      ),
      new Upgrade(
        "True chocolate",
        37500000000000,
        "Alchemy labs are twice as efficient",
        25
      ),
      new Upgrade(
        "Ambrosia",
        3750000000000000,
        "Alchemy labs are twice as efficient",
        50
      ),
      new Upgrade(
        "Aqua crustulae",
        375000000000000000,
        "Alchemy labs are twice as efficient",
        100
      ),
      new Upgrade(
        "Origin crucible",
        37500000000000000000,
        "Alchemy labs are twice as efficient",
        150
      ),
      new Upgrade(
        "Theory of atomic fluidity",
        37500000000000000000000,
        "Alchemy labs are twice as efficient",
        200
      ),
      new Upgrade(
        "Beige goo",
        37500000000000000000000000,
        "Alchemy labs are twice as efficient",
        250
      ),
      new Upgrade(
        "The advent of chemistry",
        37500000000000000000000000000,
        "Alchemy labs are twice as efficient",
        300
      ),
      new Upgrade(
        "On second thought",
        37500000000000000000000000000000,
        "Alchemy labs are twice as efficient",
        350
      ),
      new Upgrade(
        "Public betterment",
        375000000000000000000000000000000000,
        "Alchemy labs are twice as efficient",
        400
      ),
    ]),
    new Building("Portal", 1000000000000, 10000000, [
      new Upgrade(
        "Ancient tablet",
        10000000000000,
        "Portals are twice as efficient",
        1
      ),
      new Upgrade(
        "Insane oatling workers",
        50000000000000,
        "Portals are twice as efficient",
        5
      ),
      new Upgrade(
        "Soul bond",
        500000000000000,
        "Portals are twice as efficient",
        25
      ),
      new Upgrade(
        "Sanity dance",
        50000000000000000,
        "Portals are twice as efficient",
        50
      ),
      new Upgrade(
        "Brane transplant",
        5000000000000000000,
        "Portals are twice as efficient",
        100
      ),
      new Upgrade(
        "Deity-sized portals",
        500000000000000000000,
        "Portals are twice as efficient",
        150
      ),
      new Upgrade(
        "End of times back-up plan",
        500000000000000000000000,
        "Portals are twice as efficient",
        200
      ),
      new Upgrade(
        "Maddening chants",
        500000000000000000000000000,
        "Portals are twice as efficient",
        250
      ),
      new Upgrade(
        "The real world",
        500000000000000000000000000000,
        "Portals are twice as efficient",
        300
      ),
      new Upgrade(
        "Dimensional garbage gulper",
        500000000000000000000000000000000,
        "Portals are twice as efficient",
        350
      ),
      new Upgrade(
        "Embedded microportals",
        5000000000000000000000000000000000000,
        "Portals are twice as efficient",
        400
      ),
    ]),
    new Building("Time Machine", 14000000000000, 65000000, [
      new Upgrade(
        "Flux capacitors",
        140000000000000,
        "Time machines are twice as efficient",
        1
      ),
      new Upgrade(
        "Time paradox resolver",
        700000000000000,
        "Time machines are twice as efficient",
        5
      ),
      new Upgrade(
        "Quantum conundrum",
        7000000000000000,
        "Time machines are twice as efficient",
        25
      ),
      new Upgrade(
        "Causality enforcer",
        700000000000000000,
        "Time machines are twice as efficient",
        50
      ),
      new Upgrade(
        "Yestermorrow comparators",
        70000000000000000000,
        "Time machines are twice as efficient",
        100
      ),
      new Upgrade(
        "Far future enactment",
        7000000000000000000000,
        "Time machines are twice as efficient",
        150
      ),
      new Upgrade(
        "Great loop hypothesis",
        7000000000000000000000000,
        "Time machines are twice as efficient",
        200
      ),
      new Upgrade(
        "Cookietopian moments of maybe",
        7000000000000000000000000000,
        "Time machines are twice as efficient",
        250
      ),
      new Upgrade(
        "Second seconds",
        7000000000000000000000000000000,
        "Time machines are twice as efficient",
        300
      ),
      new Upgrade(
        "Additional clock hands",
        7000000000000000000000000000000000,
        "Time machines are twice as efficient",
        350
      ),
      new Upgrade(
        "Nostalgia",
        70000000000000000000000000000000000000,
        "Time machines are twice as efficient",
        400
      ),
    ]),
    new Building("Antimatter Condenser", 170000000000000, 430000000, [
      new Upgrade(
        "Sugar bosons",
        1700000000000000,
        "Antimatter condensers are twice as efficient",
        1
      ),
      new Upgrade(
        "String theory",
        8500000000000000,
        "Antimatter condensers are twice as efficient",
        5
      ),
      new Upgrade(
        "Large macaron collider",
        85000000000000000,
        "Antimatter condensers are twice as efficient",
        25
      ),
      new Upgrade(
        "Big bang bake",
        8500000000000000000,
        "Antimatter condensers are twice as efficient",
        50
      ),
      new Upgrade(
        "Reverse cyclotrons",
        850000000000000000000,
        "Antimatter condensers are twice as efficient",
        100
      ),
      new Upgrade(
        "Nanocosmics",
        85000000000000000000000,
        "Antimatter condensers are twice as efficient",
        150
      ),
      new Upgrade(
        "The Pulse",
        85000000000000000000000000,
        "Antimatter condensers are twice as efficient",
        200
      ),
      new Upgrade(
        "Some other super-tiny fundamental particle? Probably?",
        85000000000000000000000000000,
        "Antimatter condensers are twice as efficient",
        250
      ),
      new Upgrade(
        "Quantum comb",
        85000000000000000000000000000000,
        "Antimatter condensers are twice as efficient",
        300
      ),
      new Upgrade(
        "Baking Nobel prize",
        85000000000000000000000000000000000,
        "Antimatter condensers are twice as efficient",
        350
      ),
      new Upgrade(
        "The definite molecule",
        850000000000000000000000000000000000000,
        "Antimatter condensers are twice as efficient",
        400
      ),
    ]),
    new Building("Prism", 2100000000000000, 2900000000, [
      new Upgrade(
        "Gem polish",
        21000000000000000,
        "Prims are twice as efficient",
        1
      ),
      new Upgrade(
        "9th color",
        105000000000000000,
        "Prims are twice as efficient",
        5
      ),
      new Upgrade(
        "Chocolate light",
        1050000000000000000,
        "Prims are twice as efficient",
        25
      ),
      new Upgrade(
        "Grainbow",
        105000000000000000000,
        "Prims are twice as efficient",
        50
      ),
      new Upgrade(
        "Pure cosmic light",
        10500000000000000000000,
        "Prims are twice as efficient",
        100
      ),
      new Upgrade(
        "Glow-in-the-dark",
        1050000000000000000000000,
        "Prims are twice as efficient",
        150
      ),
      new Upgrade(
        "Lux sanctorum",
        1050000000000000000000000000,
        "Prims are twice as efficient",
        200
      ),
      new Upgrade(
        "Reverse shadows",
        1050000000000000000000000000000,
        "Prims are twice as efficient",
        250
      ),
      new Upgrade(
        "Crystal mirrors",
        1050000000000000000000000000000000,
        "Prims are twice as efficient",
        300
      ),
      new Upgrade(
        "Reverse theory of light",
        1050000000000000000000000000000000000,
        "Prisms are twice as efficient",
        350
      ),
      new Upgrade(
        "Light capture measures",
        10500000000000000000000000000000000000000,
        "Prisms are twice as efficient",
        400
      ),
    ]),
    new Building("Chancemaker", 26000000000000000, 21000000000, [
      new Upgrade(
        "Your lucky cookie",
        260000000000000000,
        "Chancemakers are twice as efficient",
        1
      ),
      new Upgrade(
        "'All Bets Are Off' magic coin",
        130000000000000000,
        "Chancemakers are twice as efficient",
        5
      ),
      new Upgrade(
        "Winning lottery ticket",
        13000000000000000000,
        "Chancemakers are twice as efficient",
        25
      ),
      new Upgrade(
        "Four-leaf clover field",
        130000000000000000000,
        "Chancemakers are twice as efficient",
        50
      ),
      new Upgrade(
        "A recipe book about books",
        13000000000000000000000,
        "Chancemakers are twice as efficient",
        100
      ),
      new Upgrade(
        "Leprechaun village",
        13000000000000000000000000,
        "Chancemakers are twice as efficient",
        150
      ),
      new Upgrade(
        "Improbability drive",
        13000000000000000000000000000,
        "Chancemakers are twice as efficient",
        200
      ),
      new Upgrade(
        "Antisuperstistronics",
        13000000000000000000000000000000,
        "Chancemakers are twice as efficient",
        250
      ),
      new Upgrade(
        "Bunnypedes",
        13000000000000000000000000000000000,
        "Chancemakers are twice as efficient",
        300
      ),
      new Upgrade(
        "Revised probalistics",
        13000000000000000000000000000000000000,
        "Chancemakers are twice as efficient",
        350
      ),
      new Upgrade(
        "0-sided dice",
        130000000000000000000000000000000000000000,
        "Chancemakers are twice as efficient",
        400
      ),
    ]),
    new Building("Fractal Engine", 310000000000000000, 150000000000, [
      new Upgrade(
        "Metabakeries",
        3100000000000000000,
        "Fractal engines are twice as efficient",
        1
      ),
      new Upgrade(
        "Mandelbrown sugar",
        15500000000000000000,
        "Fractal engines are twice as efficient",
        5
      ),
      new Upgrade(
        "Fractoids",
        155000000000000000000,
        "Fractal engines are twice as efficient",
        25
      ),
      new Upgrade(
        "Nested universe theory",
        15500000000000000000000,
        "Fractal engines are twice as efficient",
        50
      ),
      new Upgrade(
        "Menger sponge cake",
        1550000000000000000000000,
        "Fractal engines are twice as efficient",
        100
      ),
      new Upgrade(
        "One particularly good-humoured cow",
        155000000000000000000000000,
        "Fractal engines are twice as efficient",
        150
      ),
      new Upgrade(
        "Chocolate ouroboros",
        155000000000000000000000000000,
        "Fractal engines are twice as efficient",
        200
      ),
      new Upgrade(
        "Nested",
        155000000000000000000000000000000,
        "Fractal engines are twice as efficient",
        250
      ),
      new Upgrade(
        "Space-filling fibers",
        155000000000000000000000000000000000,
        "Fractal engines are twice as efficient",
        300
      ),
      new Upgrade(
        "Endless book of prose",
        155000000000000000000000000000000000000,
        "Fractal engines are twice as efficient",
        350
      ),
      new Upgrade(
        "The set of all sets",
        1550000000000000000000000000000000000000000,
        "Fractal engines are twice as efficient",
        400
      ),
    ]),
    new Building("Java Console", 71000000000000000000, 1100000000000, [
      new Upgrade(
        "The JavaScript console for dummies",
        710000000000000000000,
        "Java consoles are twice as efficient",
        1
      ),
      new Upgrade(
        "64bit Arrays",
        3550000000000000000000,
        "Java consoles are twices as efficient",
        5
      ),
      new Upgrade(
        "Stack overflow",
        35500000000000000000000,
        "Java consoles are twice as efficient",
        25
      ),
      new Upgrade(
        "Enterprise compiler",
        3550000000000000000000000,
        "Java consoles are twice as efficient",
        50
      ),
      new Upgrade(
        "Syntactic sugar",
        355000000000000000000000000,
        "Java consoles are twice as efficient",
        100
      ),
      new Upgrade(
        "A nice cup of coffee",
        35500000000000000000000000000,
        "Java consoles are twice as efficient",
        150
      ),
      new Upgrade(
        "Just-in-time baking",
        35500000000000000000000000000000,
        "Java consoles are twice as efficient",
        200
      ),
      new Upgrade(
        "cookies++",
        35500000000000000000000000000000000,
        "Java consoles are twice as efficient",
        250
      ),
      new Upgrade(
        "Software updates",
        35500000000000000000000000000000000000,
        "Java consoles are twice as efficient",
        300
      ),
      new Upgrade(
        "Game.Loop",
        35500000000000000000000000000000000000000,
        "Java consoles are twice as efficient",
        350
      ),
      new Upgrade(
        "eval()",
        355000000000000000000000000000000000000000000,
        "Java consoles are twice as efficient",
        400
      ),
    ]),
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
  achievement: new Achievements(),
  player: new Player(),
  upgradeHall: new UpgradeHall(),
  giveCookies(num) {
    this.player.earnCookie(num);
  },
  images: {
    stages: [
      { limit: 10, image: "./images/ri2.jpeg" },
      { limit: 20, image: "./images/ri3.jpeg" },
      { limit: 30, image: "./images/ri4.jpeg" },
    ],
    changeImage(limit) {
      const imageContainer = document.getElementById("left-background");
      if (limit > 10) imageContainer.src = this.stages[0].image;
      if (limit >= 10 && limit < 20) imageContainer.src = this.stages[1].image;
      if (limit > 20 && limit <= 30) imageContainer.src = this.stages[2].image;
    },
  },
  logic: {
    newsLogic() {
      setInterval(() => {
        game.updateDisplays("enabled");
        game.challengeActions.handleChallengePopUpTrigger();

        game.upgradeHall.generateHTML();
      }, 3000);
    },

    updateLogic() {
      setInterval(() => {
        game.achievement.achievementTriggerListener();
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
    this.images.changeImage(game.player.cookieStats.Earned);
    enableNews === "enabled" && this.constructNews();
  },
  constructNews() {
    const newsArr = game.news.generateNews();
    let currentNews = [];
    newsArr.length > 0
      ? (currentNews = [newsArr[Math.floor(Math.random() * newsArr.length)]])
      : "";
    newsArr.length > 0 &&
      game.utilities.updateText("newsContainer", currentNews[0]);
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
    game.handleMenuChange();

    game.constructShop();
    game.constructNews();
    game.achievement.constructAchievements();
    game.logic.clickAndShopLogic();
    game.logic.newsLogic();
    game.logic.updateLogic();
    game.images.changeImage();
  },
};

game.start();
