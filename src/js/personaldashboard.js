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

            return App.initUI();
        });
    },


    initUI: async () => {
        console.log("App.initUI()");

        const loanRequestPlatformInstance = await App.contracts.loanRequestPlatform.deployed();

        const acct = (await web3.eth.getAccounts())[0];
        console.log(acct);

        const yourLoanRequests = await loanRequestPlatformInstance.getYourLoanRequestContracts();

        console.log("You have " + yourLoanRequests.length + " loan requests");
        console.log(yourLoanRequests);

        for (let i = 0; i  < yourLoanRequests.length; i++) {
            const lr = yourLoanRequests[i];
            const res = await loanRequestPlatformInstance.extractLoanRequestContractData(lr);

            console.log(res);

            // unpack and convert values to appropriate format
            const amountReq = res[1].toString();
            const amountAcc = res[2].toString();
            const numLoaners = res[5].toNumber();

            // unpack and rename to the following new variable names
            const {0: requestee, 3: reason, 4: repaymentPlan} = res;

            console.log("Request %s/%s because of %s. Backed by %d", amountAcc, amountReq, reason, numLoaners);

            // update UI


        }



        
        // var req = result[0];
        // var acc = result[1];
        //
        // var prog = parseFloat(acc) / parseFloat(req);
        // $('#progressbar')
        //     .html(prog.toFixed(2) + '%')
        //     .css('width', prog + '%');
        //
        // $('#amountaccumulated').html(parseFloat(acc).toFixed(2) + " out of " + parseFloat(req).toFixed(2) + " ETH raised");
        // $('#reason').html(result[2]);
        // $('#repaymentplan').html(result[3]);



        return App.bindEvents();
    },


    bindEvents: () => {
        // on button click, grab which loan request was selected if there are multiple being displayed
        $('#repay').click(e => {
            App.repay($(this).attr("data-contract-num"));
        })
    },

    repay: async (contractNum)=> {

        let acct = (await web3.eth.getAccounts())[0];
        console.log(acct);

        let loanRequestPlatformInstance = await App.contracts.loanRequestPlatform.deployed();
        let yourLoanRequests = await loanRequestPlatformInstance.getYourLoanRequestContracts.call();

        // repay the desired loan
        let tx = await loanRequestPlatformInstance.repayLoan(yourLoanRequests[contractNum], {from: acct});

        console.log("loan has been paid off");


    }



};

$(window).on("load", function () {

    App.init();

});

