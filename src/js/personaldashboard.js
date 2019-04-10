var app = new Vue({
    el: '#loanDisplay',
    data: {
        yourLoans: [],
        maxPerRow: 2,
    },
    computed: {
        yourGroupedLoans: function () {
            return _.chunk(this.yourLoans, this.maxPerRow);
        }
    }
});


App = {

    web3Provider: null,
    contracts: {},

    init: () => {
        console.log("App.init()");
        return App.initWeb3();
    },

    initWeb3: () => {
        if (typeof web3 !== 'undefined') { // check if injected web3 provider such as metamask
            App.web3Provider = web3.currentProvider;
            console.log("found existing web3 provider");
        } else {
            App.web3Provider = new Web3.providers.HttpProvider("http://127.0.0.1:7545");
            console.log("connecting to local Ganache");
        }
        web3 = new Web3(App.web3Provider);
        console.log("initialized web3 instance");
        return App.initContract();
    },

    initContract: () => {

        $.getJSON("LoanRequestPlatform.json", (data) => {
            // This creates an instance of the contract we can interact with.
            App.contracts.loanRequestPlatform = TruffleContract(data);
            // Set the provider for our contract
            App.contracts.loanRequestPlatform.setProvider(App.web3Provider);
            console.log("initialized loan request platform contract");

            return App.initLoanRequestsData();
        });
    },

    initLoanRequestsData: async () => {
        const loanRequestPlatformInstance = await App.contracts.loanRequestPlatform.deployed();

        // addresses of all your loan requests
        const lras = await loanRequestPlatformInstance.getYourLoanRequestContracts();
        console.log("You have " + lras.length + " loan requests");

        // create a list of objects of the actual loan request data
        let lrads = [];
        for (const lra of lras) {
            const lrd = await loanRequestPlatformInstance.extractLoanRequestContractData(lra);
            lrads.push([lra, lrd]);
        }
        // parse into nice format
        app.yourLoans = formatLoanRequestData(lrads);

        return App.initUI();
    },


    initUI: async () => {
        console.log("App.initUI()");

        const acct = (await web3.eth.getAccounts())[0];
        $("#account").text(acct);

        return App.bindEvents();
    },

    bindEvents: () => {
        // on button click, grab which loan request was selected if there are multiple being displayed
        $('.repay-btn').click(function () {

            let contractNum = parseInt($(this).attr("data-contract-num"));
            console.log("Contract number %d clicked", contractNum);

            App.repay(contractNum);
        })

    },

    repay: async (contractNum) => {

        const acct = (await web3.eth.getAccounts())[0];

        const loanRequestPlatformInstance = await App.contracts.loanRequestPlatform.deployed();

        // the loan we will be repaying (contract address stored in the object)
        const repayLoanRequest = app.yourLoans[contractNum];
        console.log(repayLoanRequest);

        try {

            const gas = await loanRequestPlatformInstance.repayLoan.estimateGas(repayLoanRequest.lra, {
                from: acct,
                value: web3.utils.toWei(repayLoanRequest.amountReq) // amount to repay
            });
            let tx = await loanRequestPlatformInstance.repayLoan(repayLoanRequest.lra, {
                from: acct,
                gas: parseInt(gas * 1.2),
                value: web3.utils.toWei(repayLoanRequest.amountReq)
            });

            console.log(tx);
            console.log("loan has been paid off");

            window.location.href = "personaldashboard.html"

        } catch (e) {
            console.log(e);
        }

    }

};


$(window).on("load", function () {

    App.init();

});

