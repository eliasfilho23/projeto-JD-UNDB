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
        this.upgrades.forEach(upgrade => {
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
        if (this.name == 'Cursor') { game.player.aMPC = 1; }
        this.upgrades.forEach(upgrade => {
            if (upgrade.owned == true) {
                if (upgrade.special == false) {
                    multiplier *= 2;
                    if (this.name == 'Cursor') {
                        player.aMPC *= 2;
                    }
                } else {
                    // Special casing for all special types of upgrades
                    // There may at some point be more than just cursors here, as theres special stuff for grandmas as well.
                    switch (this.name) {
                        case 'Cursor':
                            let nonCursorBuildingCount = buildingCount - this.amount;
                            this.specialCPS += (upgrade.special * nonCursorBuildingCount) * this.amount;
                            player.aMPC += (upgrade.special * nonCursorBuildingCount);
                    }
                }
            }
        });
        return multiplier;
    }

    getCPS() {
        this.multiplier = this.calculateEffectOfUpgrades();
        this.effect = ((this.baseEffect * this.amount) * this.multiplier) + this.specialCPS;
        return this.effect;
    }

    getCost(amount) {
        let bulkCost = this.cost;
        let tempPrice = this.cost;
        for (let i = 0; i < amount - 1; i++) {
            bulkCost += Math.round(tempPrice *= 1.15);
        }
        return bulkCost;
    }

    generateMenuButton() {
        return `<button onclick="game.updateShop('${this.name}');">${this.name}</button>`;
    }   

    generateBuyButtons() {
        let format = game.utilities.formatNumber;
        let html = '<div class="btnBuyGroup">';
        html += `<button onclick="game.buyBuilding('${this.name}', 1);">Buy x1</br><b>${format(this.cost)}</b></button>`
        html += `<button onclick="game.buyBuilding('${this.name}', 5);">Buy x5</br><b>${format(this.getCost(5))}</b></button>`;
        html += `<button onclick="game.buyBuilding('${this.name}', 10);">Buy x10</br><b>${format(this.getCost(10))}</b></button>`;
        html += '</div>';
        return html;
    }

    generateUpgradeButtons() {
        let html = '';
        let notMet = false;
        this.upgrades.forEach(upgrade => {
            let format = game.utilities.formatNumber;
            if (upgrade.owned == false) {
                if (upgrade.requirementMet(this.amount)) {
                    html += `<button class="upgBtn" onclick="game.buyUpgrade('${this.name}', '${upgrade.name}')"><b>${upgrade.name}</b></br>${upgrade.desc}</br><b>${format(upgrade.cost)}</b></button>`
                } else {
                    if (notMet == false) {
                        notMet = true;
                        html += `</br><button class="upgNext">Next upgrade in <b>${upgrade.limit - this.amount}</b> more ${this.name.toLowerCase()}(s)</button>`;
                    }
                }
            }
        });
        return html;
    }

    retrieveBuildingStats() {
        const buildingStats = game.buildings.map((el) => {
            if(el.amount > 0) {
                return {name: el.name, amount: el.amount}
            }
        })
        return buildingStats
    }

    generateShopHTML() {
        let format = game.utilities.formatNumber;
        let singleEffect = (this.baseEffect * this.multiplier)
        if (this.specialCPS > 0) {
            singleEffect += (this.specialCPS / this.amount);
        }
        let html = `<b>${this.name}</b></br>You have <b>${this.amount}</b> ${this.name.toLowerCase()}(s).</br>Each ${this.name.toLowerCase()} produces <b>${format(singleEffect)}</b> cookie(s).</br>All of your ${this.name.toLowerCase()}(s) combined produces <b>${format(this.effect)}</b> cookie(s).</br>${this.generateBuyButtons()}</br>${this.generateUpgradeButtons()}`;
        return html;
    }
}
const buildToActivateMethod = new Building;
class UpgradeHall {
    upgradeHallHTMLSections = document.getElementsByClassName('upgrade-hall-child')
    
    returnElAmountBySectionId(){
        const buildingStats = buildToActivateMethod.retrieveBuildingStats()

        const relationIdAmount = []
        for(let i = 0; i < this.upgradeHallHTMLSections.length; i++){
            if(this.upgradeHallHTMLSections[i]){
            const currentParsedElement = this.upgradeHallHTMLSections[i]
            const buildingName = currentParsedElement.id
            const currentSection = buildingStats.find((el) => 
                el? el.name === buildingName : '')
            if(currentSection){
                let currentSectionElementToDisplayAmount;
                currentSection.amount >= 8 ? currentSectionElementToDisplayAmount = 8 : (
                    currentSectionElementToDisplayAmount = currentSection.amount
                )
                relationIdAmount.push({
                    sectionIdAndName: currentParsedElement.id,
                    amount: currentSectionElementToDisplayAmount,
                })
            }
        }}
        return relationIdAmount;
    }

    generateHTML() {
        const data = this.returnElAmountBySectionId()
        data && data.forEach((el) => {
            const currentSection = document.getElementById(el.sectionIdAndName)
            for(let i = 0; i < el.amount; i++){
                currentSection.style = 'visibility: visible'
                currentSection.childNodes.length !== el.amount?(
                currentSection.innerHTML += (
                    `<img style='width: 100px' src='./images/upgrade-hall-jpeg/sprite-${el.sectionIdAndName}.jpeg' alt='${el.sectionIdAndName}'/>`
                )) : ''
            }
        })
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

const challengeDiv = document.getElementById('challenge-div')
const anwserRelationHTML = [
    {
        limit: 10,
        true: 'resposta correta!',
        false: 'resposta falsa!',
        alreadyPopped: false
    },
    {
        limit: 120,
        true: 'resposta correta!',
        false: 'resposta falsa!',
        alreadyPopped: false
    }
]
class Challenges {

    initChallengeRelation() {
        anwserRelationHTML.forEach((entry) => {
            if(game.player.cookieStats.Earned > entry.limit){
                entry.alreadyPopped = true
            }
        })
    }

    handleChallengePopUpTrigger(){
        if(game.player.cookieStats.Earned > anwserRelationHTML[0].limit
             && anwserRelationHTML[0].alreadyPopped === false){
            this.handleChallengeDisplay(1)
            anwserRelationHTML[0].alreadyPopped = true
        }
        if(game.player.cookieStats.Earned > anwserRelationHTML[1].limit &&
             anwserRelationHTML[1].alreadyPopped === false){
            this.handleChallengeDisplay(2)
            anwserRelationHTML[1].alreadyPopped = true
        }
    }

    generateChallengeHTML(challenge){
        challengeDiv.className= 'challengeDiv'
        challengeDiv.style = ''
        switch (challenge){
        case 1:
            challengeDiv.innerHTML = (
             `<div class='challengeDivTitle'>Pergunta numero 1</div>
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
                 `)
            break;
        case 2:
            challengeDiv.innerHTML = (
            `<div class='challengeDivTitle'>Pergunta numero 2</div>
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
            `)
            break;
        }
    }

    handleChallengeAnwser(challengeHTML, won, amount){
        challengeDiv.innerHTML = (`
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
            ${won === true? `
                <div style='font-size: xx-large; text-align:center'>Ganhou ${amount} pontos!</div>`: ''}
            <div class='challengeDivButtons'>
                <button class='challenge-anwser-close-btn challenge1Btns'>Fechar</button>
            </div>
            `)
        const anwserCloseBtn = document.getElementsByClassName('challenge-anwser-close-btn')[0]
        anwserCloseBtn.addEventListener('click', () => {
            challengeDiv.style = 'display: none'
            challengeDiv.innerHTML = ''

        })
    }

    handleChallengeDisplay(n){
        switch (n) {
            case 1:
                this.generateChallengeHTML(1)
                const challenge1Btns = document.getElementsByClassName('challenge1Btns')
                for(let i = 0; i < challenge1Btns.length; i++){
                    challenge1Btns[i].addEventListener('click', () => {
                        i === 1 ? (
                            game.player.earnCookie(79),
                            this.handleChallengeAnwser(anwserRelationHTML[0].true, true, 79)) : 
                            this.handleChallengeAnwser(anwserRelationHTML[0].false
                        )
                    })        
                }
                break;
            case 2:
                this.generateChallengeHTML(2)
                const challenge2Btns = document.getElementsByClassName('challenge2Btns')
                for(let i = 0; i < challenge2Btns.length; i++){
                    challenge2Btns[i].addEventListener('click', () => {
                        i === 1 ? (
                            game.player.earnCookie(79), 
                            this.handleChallengeAnwser(anwserRelationHTML[1].true, true, 79)) : 
                            this.handleChallengeAnwser(anwserRelationHTML[1].false)
                    })
                }
                break;
        }
    }
}
class Achievements {
    achievements = [
        {
            name: 'Cookie Amateur',
            status: 'disabled',
            description: 'Fez 15 cookies',
            trigger: 'limit',
            triggerDetail: 15
        },
        {
            name: 'Cookie Enjoyer',
            status: 'disabled',
            description: 'Fez 20 cookies',
            trigger: 'limit',
            triggerDetail: 20
        },
        {
            name: 'Cookie Entrepreneur',
            status: 'disabled',
            description: 'Fez 50 cookies',
            trigger: 'limit',
            triggerDetail: 50
        },
        {
            name: 'Cookie Racist',
            status: 'disabled',
            description: 'Fez 100 cookies',
            trigger: 'limit',
            triggerDetail: 100
        },
        {
            name: 'Cookie Jeffrey Epstein',
            status: 'disabled',
            description: 'Fez 150 cookies',
            trigger: 'limit',
            triggerDetail: 150
        },
        {
            name: 'Cookie Drake Bell',
            status: 'disabled',
            description: 'Fez 200 cookies',
            trigger: 'limit',
            triggerDetail: 200
        },
        {
            name: 'Cookie Drake',
            status: 'disabled',
            description: 'Fez 500 cookies',
            trigger: 'limit',
            triggerDetail: 500
        },
        {
            name: 'Cookie P Diddy',
            status: 'disabled',
            description: 'Fez 1000 cookies',
            trigger: 'limit',
            triggerDetail: 1000
        },
    ];

    relateAchievementsStatus(){
        let relation = ''
        this.achievements.map((ac) => {
            ac.status === 'disabled'? relation += '0' : relation += '1'
        })
        return relation;
    }

    updateAchievementHTML(){
        let finalHtml = ''
        // const currentStatusTitle = document.getElementsByClassName('current-status-label')[0]
        // currentStatusTitle.innerHTML = 'Conquistas'
        this.achievements.forEach((ac) => {
            if(ac.status === 'enabled'){
            finalHtml += (
                `<div class='achievement-list-child'>
                    <h3>${ac.name}</h3>
                    <div>${ac.description}</div>
                </div>`
            )}
        })
        game.utilities.updateText('achievements-list',finalHtml)
        this.relateAchievementsStatus()
    }

    achievementTriggerListener(){
        const currentCookies = game.player.cookieStats.Earned
        this.achievements.forEach((ac) => {
            if (ac.trigger === 'limit' && ac.status === 'disabled'){
                currentCookies >= ac.triggerDetail? (
                    ac.status = 'enabled', alert((`Conquista desbloqueada:
                         ${ac.name}: ${ac.description}`))) : ''
            }
        })
        this.updateAchievementHTML()
    }

    constructAchievements(){
        const currentCookies = game.player.cookieStats.Earned
        this.achievements.forEach((ac) => {
            if (ac.trigger === 'limit' && ac.status === 'disabled'){
                currentCookies >= ac.triggerDetail? (
                    ac.status = 'enabled') : ''
            }
        })
        this.updateAchievementHTML()
        
    }
}
class Player {
    constructor() {
        this.cookies = 0;
        this.cookieStats = {
            Earned: 0,
            Spent: 0,
            Clicked: 0
        }
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
        key: 'cookieclicker'
    },

    challengeActions: new Challenges(),
    news: {
        defaultNewsArray: [
            { "news": "lorem ipsum 1", "limit": 10 },
            { "news": "lorem ipsum 2", "limit": 20 },
            { "news": "dolor sit amet 3", "limit": 40 },
            { "news": "consectetur adipiscing 4", "limit": 70 },
            { "news": "elit sed do 5", "limit": 110 },
            { "news": "eiusmod tempor 6", "limit": 160 },
            { "news": "incididunt ut 7", "limit": 220 },
            { "news": "labore et dolore 8", "limit": 290 },
            { "news": "magna aliqua 9", "limit": 370 },
            { "news": "ut enim ad 10", "limit": 460 },
            { "news": "minim veniam 11", "limit": 560 }
        ],
        milestoneNewsArray: [
            { "news": "pikachu", "limit": 100 },
            { "news": "raichu", "limit": 1000 },
            { "news": "riolu", "limit": 5000 },
            { "news": "lucario", "limit": 10000 },
        ],

        
        generateNews() {
            const totalCookies = game.player.cookieStats.Earned
            const regularNews = []
            const milestoneNews = []
            this.defaultNewsArray.forEach((el) => {
                if(el.limit <= totalCookies){
                    regularNews.push(el)
                }
            })
            this.milestoneNewsArray.forEach((el) => {
                if(el.limit <= totalCookies){
                    milestoneNews.push(el)
                }
            })
            // 3 - 2 (being both milestone the same entry)
            enabledNews= [ 
                regularNews[regularNews.length-1],
                regularNews[regularNews.length-2],
                regularNews[regularNews.length-3],
                milestoneNews[milestoneNews.length-1],
                milestoneNews[milestoneNews.length-1],
            ]
            return enabledNews;
        },
    },

    handleStatsToggle(currentListElement){
        listElements = document.getElementsByClassName('status-label')
        for(let i = 0; i < listElements.length; i++){
            const currentListItem = document.getElementById(`${listElements[i].className.split(' ')[1]}-list`)
            currentListItem.id === currentListElement.id ? (
                currentListItem.style = 'visibility: visible'
            ) : currentListItem.style = 'visibility: hidden'
        }},

    handleMenuChange() {
        const elements = document.getElementsByClassName('status-label')
        for(let i = 0; i < elements.length; i++){
            elements[i].addEventListener('click', () => {
                const currentListElement = document.getElementById(`${elements[i].className.split(' ')[1]}-list`)
                this.handleStatsToggle(currentListElement)
            })
        }
    },
    
    buildings: [
        // Generate all buildings here
        new Building('Cursor', 15, 0.1, [
            new Upgrade('Reinforced Index Finger', 100, 'Cursors and clicking are twice as efficient', 1),
            new Upgrade('Carpal tunnel prevention cream', 500, 'Cursors and clicking are twice as efficient', 1),
            new Upgrade('Ambidextrous', 10000, 'Cursors and clicking are twice as efficient', 10),
            new Upgrade('Thousand Fingers', 100000, 'Mouse and cursors gain +0.1 cookies for every non-cursor building owned', 25, 0.1),
            new Upgrade('Million Fingers', 10000000, 'Mouse and cursors gain +0.5 cookies for every non-cursor building owned', 50, 0.5),
            new Upgrade('Billion Fingers', 100000000, 'Mouse and cursors gain +5 cookies for every non-cursor building owned', 100, 5),
            new Upgrade('Trillion Fingers', 1000000000, 'Mouse and cursors gain +50 for every non-cursor building owned', 150, 50),
            new Upgrade('Quadrillion Fingers', 10000000000, 'Mouse and cursors gain +500 cookies for each non-cursor building owned', 200, 500),
            new Upgrade('Quintillion Fingers', 10000000000000, 'Mouse and cursors gain +5.000K for every non-cursor building owned', 250, 5000),
            new Upgrade('Sextillion Fingers', 10000000000000000, ' Mouse and cursors gain +50.000K for every non-cursor building owned', 300, 50000),
            new Upgrade('Septillion Fingers', 10000000000000000000, 'Mouse and cursors gain +500.000K for every non-cursor building owned', 350, 500000),
            new Upgrade('Octillion Fingers', 10000000000000000000000, 'Mouse and cursors gain +5.000M for each non-cursor building owned', 400, 5000000)
        ], false),
        new Building('Grandma', 100, 1, [
            new Upgrade('Forwards from grandma', 1000, 'Grandmas are twice as efficient', 1),
            new Upgrade('Steel-plated rolling pins', 5000, 'Grandmas are twice as efficient', 5),
            new Upgrade('Lubricated dentures', 50000, 'Grandmas are twice as efficient', 25),
            new Upgrade('Prune juice', 5000000, 'Grandmas are twice as efficient', 50),
            new Upgrade('Double-thick glasses', 500000000, 'Grandmas are twice as efficient', 100),
            new Upgrade('Aging agents', 50000000000, 'Grandmas are twice as efficient', 150),
            new Upgrade('Xtreme walkers', 50000000000000, 'Grandmas are twice as efficient', 200),
            new Upgrade('The Unbridling', 50000000000000000, 'Grandmas are twice as efficient', 250),
            new Upgrade('Reverse dementia', 50000000000000000000, 'Grandmas are twice as efficient', 300),
            new Upgrade('Timeproof hair dyes', 50000000000000000000000, 'Grandmas are twice as efficient', 350),
            new Upgrade('Good manners', 500000000000000000000000000, 'Grandmas are twice as efficient', 400),
        ]),
        new Building('Farm', 1100, 8, [
            new Upgrade('Cheap hoes', 11000, 'Farms are twice as efficient', 1),
            new Upgrade('Fertilizer', 55000, 'Farms are twice as efficient', 5),
            new Upgrade('Biscuit Trees', 550000, 'Farms are twice as efficient', 25),
            new Upgrade('Genetically-modified Biscuits', 55000000, 'Farms are twice as efficient', 50),
            new Upgrade('Gingerbread scarecrows', 5500000000, 'Farms are twice as efficient', 100),
            new Upgrade('Pulsar sprinklers', 550000000000, 'Farms are twice as efficient', 150),
            new Upgrade('Fudge fungus', 550000000000000, 'Farms are twice as efficient', 200),
            new Upgrade('Wheat triffids', 550000000000000000, 'Farms are twice as efficient', 250),
            new Upgrade('Humane pesticides', 550000000000000000000, 'Farms are twice as efficient', 300),
            new Upgrade('Barnstars', 550000000000000000000000, 'Ah, yes. These help quite a bit. Somehow.', 350),
            new Upgrade('Lindworms', 5500000000000000000000000000, 'You have to import these from far up north, but they really help areate the soil', 400)
        ]),
        new Building('Mine', 12000, 47, [
            new Upgrade('Sugar gas', 120000, 'Mines are twice as efficient', 1),
            new Upgrade('Megadrill', 600000, 'Mines are twice as efficient', 5),
            new Upgrade('Ultradrill', 6000000, 'Mines are twice as efficient', 25),
            new Upgrade('Ultimadrill', 600000000, 'Mines are twice as efficient', 50),
            new Upgrade('H-bomb Mining', 60000000000, 'Mines are twice as efficient', 100),
            new Upgrade('Coreforge', 6000000000000, 'Mines are twice as efficient', 150),
            new Upgrade('Planetsplitters', 6000000000000000, 'Mines are twice as efficient', 200),
            new Upgrade('Canola oil wells', 6000000000000000000, 'Mines are twice as efficient', 250),
            new Upgrade('Mole People', 6000000000000000000000, 'Mines are twice as efficient', 300),
            new Upgrade('Mine canaries', 6000000000000000000000000, 'Mines are twice as efficient', 350),
            new Upgrade('Bore again', 60000000000000000000000000000, 'Mines are twice as efficient', 400)
        ]),
        new Building('Factory', 130000, 260, [
            new Upgrade('Sturdier conveyor belts', 1300000, 'Factories are twice as efficient', 1),
            new Upgrade('Child labor', 6500000, 'Factories are twice as efficient', 5),
            new Upgrade('Sweatshop', 65000000, 'Factories are twice as efficient', 25),
            new Upgrade('Radium reactors', 6500000000, 'Factories are twice as efficient', 50),
            new Upgrade('Recombobulators', 650000000000, 'Factories are twice as efficient', 100),
            new Upgrade('Deep-bake process', 65000000000000, 'Factories are twice as efficient', 150),
            new Upgrade('Cyborg workforce', 65000000000000000, 'Factories are twice as efficient', 200),
            new Upgrade('78-hour days', 65000000000000000000, 'Factories are twice as efficient', 250),
            new Upgrade('Machine learning', 65000000000000000000000, 'Factories are twice as efficient', 300),
            new Upgrade('Brownie point system', 65000000000000000000000000, 'Factories are twice as efficient', 350),
            new Upgrade('"Volunteer" interns', 650000000000000000000000000000, 'Factories are twice as efficient', 400)
        ]),
        new Building('Bank', 1400000, 1400, [
            new Upgrade('Taller Tellers', 14000000, 'Banks are twice as efficient', 1),
            new Upgrade('Scissor-resistant Credit Cards', 70000000, 'Banks are twice as efficient', 5),
            new Upgrade('Acid-proof vaults', 700000000, 'Banks are twice as efficient', 25),
            new Upgrade('Chocolate coins', 70000000000, 'Banks are twice as efficient', 50),
            new Upgrade('Exponential interest rates', 7000000000000, 'Banks are twice as efficient', 100),
            new Upgrade('Financial zen', 700000000000000, 'Banks are twice as efficient', 150),
            new Upgrade('Way of the wallet', 700000000000000000, 'Banks are twice as efficient', 200),
            new Upgrade('The stuff rationale', 700000000000000000000, 'Banks are twice as efficient', 250),
            new Upgrade('Edible money', 700000000000000000000, 'Banks are twice as efficient', 300),
            new Upgrade('Grand supercycle', 700000000000000000000000, 'Banks are twice as efficient', 350),
            new Upgrade('Rules of acquisition', 7000000000000000000000000000, 'Banks are twice as efficient', 400)
        ]),
        new Building('Temple', 20000000, 7800, [
            new Upgrade('Golden idols', 200000000, 'Temples are twice as efficient', 1),
            new Upgrade('Sacrifices', 1000000000, 'Temples are twice as efficient', 5),
            new Upgrade('Delicious blessing', 10000000000, 'Temples are twice as efficient', 25),
            new Upgrade('Sun festival', 1000000000000, 'Temples are twice as efficient', 50),
            new Upgrade('Enlarged pantheon', 100000000000000, 'Temples are twice as efficient', 100),
            new Upgrade('Great Baker in the sky', 10000000000000000, 'Temples are twice as efficient', 150),
            new Upgrade('Creation myth', 10000000000000000000, 'Temples are twice as efficient', 200),
            new Upgrade('Theocracy', 10000000000000000000000, 'Temples are twice as efficient', 250),
            new Upgrade('Sick rap prayers', 10000000000000000000000000, 'Temples are twice as efficient', 300),
            new Upgrade('Psalm-reading', 10000000000000000000000000000, 'Temples are twice as efficient', 350),
            new Upgrade('War of the gods', 100000000000000000000000000000000, 'Temples are twice as efficient', 400)
        ]),
        new Building('Wizard Tower', 330000000, 44000, [
            new Upgrade('Pointier hats', 3300000000, 'Wizard towers are twice as efficient', 1),
            new Upgrade('Beardlier beards', 16500000000, 'Wizard towers are twice as efficient', 5),
            new Upgrade('Ancient grimoires', 165000000000, 'Wizard towers are twice as efficient', 25),
            new Upgrade('Kitchen curses', 16500000000000, 'Wizard towers are twice as efficient', 50),
            new Upgrade('School of sorcery', 1650000000000000, 'Wizard towers are twice as efficient', 100),
            new Upgrade('Dark formulas', 165000000000000000, 'Wizard towers are twice as efficient', 150),
            new Upgrade('Cookiemancy', 165000000000000000000, 'Wizard towers are twice as efficient', 200),
            new Upgrade('Rabbit trick', 165000000000000000000000, 'Wizard towers are twice as efficient', 250),
            new Upgrade('Deluxe tailored wands', 165000000000000000000000000, 'Wizard towers are twice as efficient', 300),
            new Upgrade('Immobile spellcasting', 165000000000000000000000000000, 'Wizard towers are twice as efficient', 350),
            new Upgrade('Electricity', 1650000000000000000000000000000000, 'Wizard towers are twices as efficient', 400)
        ]),
        new Building('Shipment', 5100000000, 260000, [
            new Upgrade('Vanilla nebulae', 51000000000, 'Shipments are twice as efficient', 1),
            new Upgrade('Wormholes', 255000000000, 'Shipments are twice as efficient', 5),
            new Upgrade('Frequent flyer', 2550000000000, 'Shipments are twice as efficient', 25),
            new Upgrade('Warp drive', 255000000000000, 'Shipments are twice as efficient', 50),
            new Upgrade('Chocolate monoliths', 25500000000000000, 'Shipments are twice as efficient', 100),
            new Upgrade('Generation ship', 2550000000000000000, 'Shipments are twice as efficient', 150),
            new Upgrade('Dyson sphere', 2550000000000000000000, 'Shipments are twice as efficient', 200),
            new Upgrade('The final frontier', 2550000000000000000000000, 'Shipments are twice as efficient', 250),
            new Upgrade('Autopilot', 2550000000000000000000000000, 'Shipments are twice as efficient', 300),
            new Upgrade('Restaurants at the end of the universe', 2550000000000000000000000000000, 'Shipments are twice as efficient', 350),
            new Upgrade('Universal alphabet', 25500000000000000000000000000000000, 'Shipments are twice as efficient', 400)
        ]),
        new Building('Alchemy Lab', 75000000000, 1500000, [
            new Upgrade('Antimony', 750000000000, 'Alchemy labs are twice as efficient', 1),
            new Upgrade('Essence of dough', 3750000000000, 'Alchemy labs are twice as efficient', 5),
            new Upgrade('True chocolate', 37500000000000, 'Alchemy labs are twice as efficient', 25),
            new Upgrade('Ambrosia', 3750000000000000, 'Alchemy labs are twice as efficient', 50),
            new Upgrade('Aqua crustulae', 375000000000000000, 'Alchemy labs are twice as efficient', 100),
            new Upgrade('Origin crucible', 37500000000000000000, 'Alchemy labs are twice as efficient', 150),
            new Upgrade('Theory of atomic fluidity', 37500000000000000000000, 'Alchemy labs are twice as efficient', 200),
            new Upgrade('Beige goo', 37500000000000000000000000, 'Alchemy labs are twice as efficient', 250),
            new Upgrade('The advent of chemistry', 37500000000000000000000000000, 'Alchemy labs are twice as efficient', 300),
            new Upgrade('On second thought', 37500000000000000000000000000000, 'Alchemy labs are twice as efficient', 350),
            new Upgrade('Public betterment', 375000000000000000000000000000000000, 'Alchemy labs are twice as efficient', 400)
        ]),
        new Building('Portal', 1000000000000, 10000000, [
            new Upgrade('Ancient tablet', 10000000000000, 'Portals are twice as efficient', 1),
            new Upgrade('Insane oatling workers', 50000000000000, 'Portals are twice as efficient', 5),
            new Upgrade('Soul bond', 500000000000000, 'Portals are twice as efficient', 25),
            new Upgrade('Sanity dance', 50000000000000000, 'Portals are twice as efficient', 50),
            new Upgrade('Brane transplant', 5000000000000000000, 'Portals are twice as efficient', 100),
            new Upgrade('Deity-sized portals', 500000000000000000000, 'Portals are twice as efficient', 150),
            new Upgrade('End of times back-up plan', 500000000000000000000000, 'Portals are twice as efficient', 200),
            new Upgrade('Maddening chants', 500000000000000000000000000, 'Portals are twice as efficient', 250),
            new Upgrade('The real world', 500000000000000000000000000000, 'Portals are twice as efficient', 300),
            new Upgrade('Dimensional garbage gulper', 500000000000000000000000000000000, 'Portals are twice as efficient', 350),
            new Upgrade('Embedded microportals', 5000000000000000000000000000000000000, 'Portals are twice as efficient', 400)
        ]),
        new Building('Time Machine', 14000000000000, 65000000, [
            new Upgrade('Flux capacitors', 140000000000000, 'Time machines are twice as efficient', 1),
            new Upgrade('Time paradox resolver', 700000000000000, 'Time machines are twice as efficient', 5),
            new Upgrade('Quantum conundrum', 7000000000000000, 'Time machines are twice as efficient', 25),
            new Upgrade('Causality enforcer', 700000000000000000, 'Time machines are twice as efficient', 50),
            new Upgrade('Yestermorrow comparators', 70000000000000000000, 'Time machines are twice as efficient', 100),
            new Upgrade('Far future enactment', 7000000000000000000000, 'Time machines are twice as efficient', 150),
            new Upgrade('Great loop hypothesis', 7000000000000000000000000, 'Time machines are twice as efficient', 200),
            new Upgrade('Cookietopian moments of maybe', 7000000000000000000000000000, 'Time machines are twice as efficient', 250),
            new Upgrade('Second seconds', 7000000000000000000000000000000, 'Time machines are twice as efficient', 300),
            new Upgrade('Additional clock hands', 7000000000000000000000000000000000, 'Time machines are twice as efficient', 350),
            new Upgrade('Nostalgia', 70000000000000000000000000000000000000, 'Time machines are twice as efficient', 400)
        ]),
        new Building('Antimatter Condenser', 170000000000000, 430000000, [
            new Upgrade('Sugar bosons', 1700000000000000, 'Antimatter condensers are twice as efficient', 1),
            new Upgrade('String theory', 8500000000000000, 'Antimatter condensers are twice as efficient', 5),
            new Upgrade('Large macaron collider', 85000000000000000, 'Antimatter condensers are twice as efficient', 25),
            new Upgrade('Big bang bake', 8500000000000000000, 'Antimatter condensers are twice as efficient', 50),
            new Upgrade('Reverse cyclotrons', 850000000000000000000, 'Antimatter condensers are twice as efficient', 100),
            new Upgrade('Nanocosmics', 85000000000000000000000, 'Antimatter condensers are twice as efficient', 150),
            new Upgrade('The Pulse', 85000000000000000000000000, 'Antimatter condensers are twice as efficient', 200),
            new Upgrade('Some other super-tiny fundamental particle? Probably?', 85000000000000000000000000000, 'Antimatter condensers are twice as efficient', 250),
            new Upgrade('Quantum comb', 85000000000000000000000000000000, 'Antimatter condensers are twice as efficient', 300),
            new Upgrade('Baking Nobel prize', 85000000000000000000000000000000000, 'Antimatter condensers are twice as efficient', 350),
            new Upgrade('The definite molecule', 850000000000000000000000000000000000000, 'Antimatter condensers are twice as efficient', 400)
        ]),
        new Building('Prism', 2100000000000000, 2900000000, [
            new Upgrade('Gem polish', 21000000000000000, 'Prims are twice as efficient', 1),
            new Upgrade('9th color', 105000000000000000, 'Prims are twice as efficient', 5),
            new Upgrade('Chocolate light', 1050000000000000000, 'Prims are twice as efficient', 25),
            new Upgrade('Grainbow', 105000000000000000000, 'Prims are twice as efficient', 50),
            new Upgrade('Pure cosmic light', 10500000000000000000000, 'Prims are twice as efficient', 100),
            new Upgrade('Glow-in-the-dark', 1050000000000000000000000, 'Prims are twice as efficient', 150),
            new Upgrade('Lux sanctorum', 1050000000000000000000000000, 'Prims are twice as efficient', 200),
            new Upgrade('Reverse shadows', 1050000000000000000000000000000, 'Prims are twice as efficient', 250),
            new Upgrade('Crystal mirrors', 1050000000000000000000000000000000, 'Prims are twice as efficient', 300),
            new Upgrade('Reverse theory of light', 1050000000000000000000000000000000000, 'Prisms are twice as efficient', 350),
            new Upgrade('Light capture measures', 10500000000000000000000000000000000000000, 'Prisms are twice as efficient', 400)
        ]),
        new Building('Chancemaker', 26000000000000000, 21000000000, [
            new Upgrade('Your lucky cookie', 260000000000000000, 'Chancemakers are twice as efficient', 1),
            new Upgrade('\'All Bets Are Off\' magic coin', 130000000000000000, 'Chancemakers are twice as efficient', 5),
            new Upgrade('Winning lottery ticket', 13000000000000000000, 'Chancemakers are twice as efficient', 25),
            new Upgrade('Four-leaf clover field', 130000000000000000000, 'Chancemakers are twice as efficient', 50),
            new Upgrade('A recipe book about books', 13000000000000000000000, 'Chancemakers are twice as efficient', 100),
            new Upgrade('Leprechaun village', 13000000000000000000000000, 'Chancemakers are twice as efficient', 150),
            new Upgrade('Improbability drive', 13000000000000000000000000000, 'Chancemakers are twice as efficient', 200),
            new Upgrade('Antisuperstistronics', 13000000000000000000000000000000, 'Chancemakers are twice as efficient', 250),
            new Upgrade('Bunnypedes', 13000000000000000000000000000000000, 'Chancemakers are twice as efficient', 300),
            new Upgrade('Revised probalistics', 13000000000000000000000000000000000000, 'Chancemakers are twice as efficient', 350),
            new Upgrade('0-sided dice', 130000000000000000000000000000000000000000, 'Chancemakers are twice as efficient', 400)
        ]),
        new Building('Fractal Engine', 310000000000000000, 150000000000, [
            new Upgrade('Metabakeries', 3100000000000000000, 'Fractal engines are twice as efficient', 1),
            new Upgrade('Mandelbrown sugar', 15500000000000000000, 'Fractal engines are twice as efficient', 5),
            new Upgrade('Fractoids', 155000000000000000000, 'Fractal engines are twice as efficient', 25),
            new Upgrade('Nested universe theory', 15500000000000000000000, 'Fractal engines are twice as efficient', 50),
            new Upgrade('Menger sponge cake', 1550000000000000000000000, 'Fractal engines are twice as efficient', 100),
            new Upgrade('One particularly good-humoured cow', 155000000000000000000000000, 'Fractal engines are twice as efficient', 150),
            new Upgrade('Chocolate ouroboros', 155000000000000000000000000000, 'Fractal engines are twice as efficient', 200),
            new Upgrade('Nested', 155000000000000000000000000000000, 'Fractal engines are twice as efficient', 250),
            new Upgrade('Space-filling fibers', 155000000000000000000000000000000000, 'Fractal engines are twice as efficient', 300),
            new Upgrade('Endless book of prose', 155000000000000000000000000000000000000, 'Fractal engines are twice as efficient', 350),
            new Upgrade('The set of all sets', 1550000000000000000000000000000000000000000, 'Fractal engines are twice as efficient', 400)
        ]),
        new Building('Java Console', 71000000000000000000, 1100000000000, [
            new Upgrade('The JavaScript console for dummies', 710000000000000000000, 'Java consoles are twice as efficient', 1),
            new Upgrade('64bit Arrays', 3550000000000000000000, 'Java consoles are twices as efficient', 5),
            new Upgrade('Stack overflow', 35500000000000000000000, 'Java consoles are twice as efficient', 25),
            new Upgrade('Enterprise compiler', 3550000000000000000000000, 'Java consoles are twice as efficient', 50),
            new Upgrade('Syntactic sugar', 355000000000000000000000000, 'Java consoles are twice as efficient', 100),
            new Upgrade('A nice cup of coffee', 35500000000000000000000000000, 'Java consoles are twice as efficient', 150),
            new Upgrade('Just-in-time baking', 35500000000000000000000000000000, 'Java consoles are twice as efficient', 200),
            new Upgrade('cookies++', 35500000000000000000000000000000000, 'Java consoles are twice as efficient', 250),
            new Upgrade('Software updates', 35500000000000000000000000000000000000, 'Java consoles are twice as efficient', 300),
            new Upgrade('Game.Loop', 35500000000000000000000000000000000000000, 'Java consoles are twice as efficient', 350),
            new Upgrade('eval()', 355000000000000000000000000000000000000000000, 'Java consoles are twice as efficient', 400)
        ])
    ],
    utilities: {
        ShortNumbers: ['K', 'M', 'B', 'T', 'Qua', 'Qui', 'Sex', 'Sep', 'Oct', 'Non', 'Dec', 'Und', 'Duo', 'Tre', 'QuaD', 'QuiD', 'SexD', 'SepD', 'OctD', 'NonD', 'Vig'],
        updateText (className, text) {
            let elements = document.getElementsByClassName(className);
            for(var i in elements) {
                elements[i].innerHTML = text;
            }
        },
        formatNumber (number) {
            let formatted = '';
            if (number >= 1000) {
                for (let i = 0; i < game.utilities.ShortNumbers.length; i++) {
                    let divider = Math.pow(10, (i + 1) * 3)
                    if (number >= divider) {
                        formatted = (Math.trunc((number / divider) * 1000) / 1000).toFixed(3) + ' ' + game.utilities.ShortNumbers[i];
                    }
                }
                return formatted;
            }
            return (Math.trunc(number * 10) / 10).toFixed(1);
        },
        getBuildingByName (name) {
            let correctBuilding = null;
            game.buildings.forEach(building => {
                if (building.name == name) {
                    correctBuilding = building;
                    return;
                }
            });
            return correctBuilding;
        },
        getBuildingIndexByName (name) {
            for (let i = 0; i < game.buildings.length - 1; i++) {
                let curBuilding = game.buildings[i];
                if (curBuilding.name == name) {
                    return i;
                }
            }
        },
        getBuildingCount () {
            let amount = 0;
            game.buildings.forEach(building => {
                amount += building.amount;
            });
            return amount;
        },
        stringToBool (string) {
            switch (string) {
                case 'true':
                    return true;
                case 'false':
                    return false;
            }
        }
    },
    saving: {
        export () {
            let saveString = '';
            saveString += `${game.player.cookies}|${game.player.cookieStats.Earned}|${game.player.cookieStats.Spent}|${game.player.cookieStats.Clicked}-`;
            let first = true;
            game.buildings.forEach(building => {
                if (first) {
                    first = false;
                    saveString += `${building.amount}|${building.locked}|`;
                } else {
                    saveString += `#${building.amount}|${building.locked}|`;
                }
                building.upgrades.forEach(upgrade => {
                    saveString += `${upgrade.owned}:`;
                });
                saveString = saveString.slice(0, -1);
            });
            game.saving.saveToCache(premagic(saveString));
            return premagic(saveString);
        },
        import (saveString) {
            saveString = magic(saveString);
            if (saveString != false) {
                saveString = saveString.split('-');
                game.saving.loadPlayer(saveString[0]);
                game.saving.loadBuildings(saveString[1]);
                game.settings.recalculateCPS = true;
                game.updateShop(game.currentShop);
            } else {
                alert('Something wasn\'t quite right there, unfortunately your save could not be loaded.');
            }
        },
        saveToCache (saveString) {
            try {  return window.localStorage.setItem(game.settings.key, saveString); } catch { console.log('Problem saving to cache'); }
        },
        getSaveFromCache () {
            try {  return window.localStorage.getItem(game.settings.key); } catch { console.log('Problem loading data from cache, probably doesn\'t exist'); }
        },
        loadPlayer (playerData) {
            playerData = playerData.split('|');
            try {
                game.player.cookies = parseFloat(playerData[0]);
                game.player.cookieStats.Earned = parseFloat(playerData[1]);
                game.player.cookieStats.Spent = parseFloat(playerData[2]);
                game.player.cookieStats.Clicked = parseFloat(playerData[3]);
            } catch { console.log('Something went wrong whilst loading player data, likely from an older version and not to worry.') }
        },
        loadBuildings (buildingData) {
            buildingData = buildingData.split('#');
            try {
                for (let i = 0; i < game.buildings.length; i++) {
                    let savedBuilding = buildingData[i];
                    let nonUpgrade = savedBuilding.split('|');
                    let building = game.buildings[i];
                    building.amount = parseFloat(nonUpgrade[0]);
                    building.setCost();
                    building.locked = game.utilities.stringToBool(nonUpgrade[1]);
                    let j = 0;
                    let upgrades = nonUpgrade[2].split(':');
                    building.upgrades.forEach(upgrade => {
                        upgrade.owned = game.utilities.stringToBool(upgrades[j]);
                        j++;
                    });
                }
            } catch { console.log('Something went wrong whilst loading building data, likely from an older version and not to worry.') }
        },
        // loadAchievements 
        wipeSave() {
            if (confirm('Are you sure you want to wipe your save? This cannot be reversed!')) {
                game.player.cookies = 0;
                game.player.cookieStats.Earned = 0;
                game.player.cookieStats.Spent = 0;
                game.player.cookieStats.Clicked = 0;
                game.buildings.forEach(building => {
                    if (building.name != 'Cursor') {
                        building.locked = true;
                    }
                    building.amount = 0;
                    building.effect = 0;
                    building.specialCPS = 0;
                    building.setCost();
                    for(var i in building.upgrades) {
                        building.upgrades[i].owned = false;
                    }
                });
                game.constructShop();
                game.updateShop('Cursor');
                game.settings.recalculateCPS = true;
            }
        },
        importing: false,
        openBox(type) {
            let container = document.getElementsByClassName('importExportBox')[0];
            let box = document.getElementById('saveBox');
            switch(type) {
                case 'import':
                    this.importing = true;
                    container.style.visibility = 'visible';
                    box.removeAttribute('readonly');
                    box.value = '';
                    return;
                case 'export':
                    let saveString = this.export();
                    container.style.visibility = 'visible';
                    box.value = saveString;
                    box.setAttribute('readonly', true);
                    return;
            }
        },
        closeBox () {
            document.getElementsByClassName('importExportBox')[0].style.visibility = 'hidden';
            if (this.importing) {
                let box = document.getElementById('saveBox');
                this.import(box.value);
                box.value = '';
            }
        }
    },
    achievement: new Achievements(),
    player: new Player(),
    upgradeHall: new UpgradeHall(),
    giveCookies(num){
        this.player.earnCookie(num)
    },
    images: {
        stages: [
            {limit: 10, image:'./images/ri2.jpeg'},
            {limit: 20, image:'./images/ri3.jpeg'},
            {limit: 30, image:'./images/ri4.jpeg'},
        ],
        changeImage(limit){
            const imageContainer = document.getElementById('left-background')
            if(limit > 10)
                imageContainer.src = this.stages[0].image
            if(limit >= 10 && limit < 20)
                imageContainer.src = this.stages[1].image
            if(limit > 20 && limit <= 30)
                imageContainer.src = this.stages[2].image
            }
    },
    logic: {
        newsLogic(){
            setInterval(() => {
            game.updateDisplays('enabled')
            game.challengeActions.handleChallengePopUpTrigger()

            game.upgradeHall.generateHTML()
        }, 3000);},

        updateLogic(){
            setInterval(() => {
            game.achievement.achievementTriggerListener()
        }, 1000);},

        clickAndShopLogic(){
            game.updateDisplays();
            // Only recalculate it when needed, saves on some processing power because this can turn out to be quite a lot of maths.
            if (game.settings.recalculateCPS == true) {
                let CPS = 0;
                game.buildings.forEach(building => {
                    CPS += building.getCPS();
                });
                game.settings.recalculateCPS = false;
                game.player.aMPF = CPS / game.settings.frameRate;
                game.updateShop(game.currentShop);
            }
            if (document.hasFocus()) {
                game.player.earnCookie(game.player.aMPF);
                game.saving.export();
                setTimeout(game.logic.clickAndShopLogic, 1000 / game.settings.frameRate);
            } else {
                game.player.earnCookie(game.player.aMPF * game.settings.frameRate);
                game.saving.export();
                setTimeout(game.logic.clickAndShopLogic, 1000);
            }
        }
    },
    updateDisplays (enableNews) {
        // Create temporary shorthand aliases for ease of use.
        let updateText = game.utilities.updateText;
        let format = game.utilities.formatNumber;
        let player = game.player;
        let stats = player.cookieStats;
        document.title = 'Cookie Clicker | ' + format(player.cookies);
        updateText('cookieDisplay', format(player.cookies));
        updateText('cpcDisplay', format(player.aMPC));
        updateText('cpsDisplay', format(player.aMPF * game.settings.frameRate));
        updateText('earnedDisplay', format(stats.Earned));
        updateText('spentDisplay', format(stats.Spent));
        updateText('clickedDisplay', format(stats.Clicked));
        this.images.changeImage(game.player.cookieStats.Earned)
        enableNews === 'enabled' && this.constructNews()
    },
    constructNews () {
        const newsArr = game.news.generateNews()
        let currentNews = [];
        newsArr.length > 0 ? currentNews = [newsArr[Math.floor(Math.random() * newsArr.length)]] : ''
        newsArr.length > 0 && game.utilities.updateText('newsContainer', currentNews[0])
    },
    constructShop () {
        let buildings = game.buildings;
        let finalHtml = '';
        buildings.forEach(building => {
            if (building.locked == false) {
                finalHtml += building.generateMenuButton();
            }
        });
        game.utilities.updateText('shopList', finalHtml);
    },
    currentShop: 'Cursor',
    updateShop (name) {
        game.currentShop = name;
        let finalHtml = '';
        let building = game.utilities.getBuildingByName(name);
        finalHtml += building.generateShopHTML();
        game.utilities.updateText('shop', finalHtml);
    },
    
    buyBuilding (name, amount) {
        let building = game.utilities.getBuildingByName(name);
        building.buy(amount);
    },
    buyUpgrade (buildingName, upgrade) {
        let building = game.utilities.getBuildingByName(buildingName);
        building.buyUpgrade(upgrade);
    },
    start () {
        // This prevents the user from holding down enter to click the cookie very quickly.
        window.addEventListener('keydown', () => {
            if (event.keyCode == 13 || event.keyCode == 32) {
                event.preventDefault();
                return false;
            }
        });
        
        // This enables the cookie clicking process.
        document.getElementsByClassName('cookieButton')[0].onclick = () => {
            game.player.clickCookie() 
        };
        const newsButton = document.getElementsByClassName('newsContainer')[0]
        newsButton.onclick = () => { // Achar o lugar disso
            const newsArr = game.news.generateNews()
            let currentNews = [newsArr[Math.floor(Math.random() * newsArr.length)].news] 
            newsButton.innerHTML = currentNews;
        }
        if(game.player.cookieStats.Earned == 15){
            console.log('it is still running.')
        }

        let localSave = game.saving.getSaveFromCache();
        if (localSave) {
            game.saving.import(localSave);
        } else {
            console.log('No cache save found');
        }

        game.challengeActions.initChallengeRelation()
        game.challengeActions.handleChallengeDisplay()
        game.handleMenuChange()


        game.constructShop();
        game.constructNews();
        game.achievement.constructAchievements()
        game.logic.clickAndShopLogic();
        game.logic.newsLogic();
        game.logic.updateLogic();
        game.images.changeImage()
    }
}

game.start();