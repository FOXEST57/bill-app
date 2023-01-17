/**
 * @jest-environment jsdom
 */

import { screen, waitFor, within } from "@testing-library/dom";
import "@testing-library/jest-dom"; // @dpe import supplementaire de la librairie pour l'environement test
import userEvent from "@testing-library/user-event";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes"; // @pde import de la fonction ROUTES
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockedStore from "../__mocks__/store"; // @pde import pour simuler les données du store
import router from "../app/Router.js";
import Bills from "../containers/Bills.js";

jest.mock("../app/Store", () => mockedStore); // @dpe on instencie un mok pour simuler le store

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);

      const windowIcon = screen.getByTestId("icon-window");
      await waitFor(() => windowIcon);
      expect(windowIcon).toHaveClass("active-icon"); //@pde - Kaban 5 vérifie si l'element windowIcon pocède bien la class active-icon
    });

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({
        data: bills,
      });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map(a => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });
    // @pde ajout tests unitaires start
   
    // @pde ce test verifie le bon fonctionnement lorsque que l'on clique sur le bouton nouvelle note de frais
    describe("When I click on New Bill Button", () => {
      test("Then I should be sent on New Bill form", () => {
        // @pde on définie la fonction onNavigate pour charger les données de la page
        const onNavigate = pathname => {
          document.body.innerHTML = ROUTES({ pathname });
        };
        /* @pde on définie la propriété localStorage de l'objet window pour 
        utilisé une instance de stockage local "localStorageMock" pour les test*/
        Object.defineProperty(window, "localStorage", { 
          value: localStorageMock,
        });
        // @pde on initialise ensuite les données de l'utilisateur pour les stocker en utilisant "window.localStorage.setItem"
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
          })
        );
        /* @pde on crée une instance de l'objet "Bills" en lui passant les paramètres 
        nécessaires: "document", "onNavigate", "store" et "localStorage" */
        const bills = new Bills({
          document,
          onNavigate,
          store: mockedStore,
          localStorage: window.localStorage,
        });
        /* @pde on charge les données en utilisant "BillsUI" */
        document.body.innerHTML = BillsUI({ data: bills });
        /* @pde on utilise la variable "buttonNewBill" pour récupérer le bouton "nouvelle note de frais" 
        en se servant de la fonction "screen.getByRole".  */
        const buttonNewBill = screen.getByRole("button", {
          name: /nouvelle note de frais/i,
        });
        expect(buttonNewBill).toBeTruthy(); // @pde verification que le bouton pour créer un nouveau bill existe 
        const handleClickNewBill = jest.fn(bills.handleClickNewBill);
        buttonNewBill.addEventListener("click", handleClickNewBill);
        userEvent.click(buttonNewBill); // @pde on click sur le bouton
        expect(handleClickNewBill).toHaveBeenCalled(); // @pde on verifie que la fonction handleClickNewBill a bien été appelé
      });
    });
    // @pde test unitaire pour vérifierque lorsque l'on click sur l'oeil le modale s'ouvre
    describe("When I click on one eye icon", () => {
      test("Then a modal should open", async () => {
         // @pde on définie la fonction onNavigate pour charger les données de la page
        const onNavigate = pathname => {
          document.body.innerHTML = ROUTES({ pathname });
        };
        /* @pde on définie la propriété localStorage de l'objet window pour 
        utilisé une instance de stockage local "localStorageMock" pour les test*/
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
         // @pde on initialise ensuite les données de l'utilisateur pour les stocker en utilisant "window.localStorage.setItem"
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
          })
        );
        /* @pde on crée une instance de l'objet "Bills" en lui passant les paramètres 
        nécessaires: "document", "onNavigate", "store" et "localStorage" */
        const billsPage = new Bills({
          document,
          onNavigate,
          store: mockedStore,
          localStorage: window.localStorage,
        }); 
        // @pde on charge les données
        document.body.innerHTML = BillsUI({ data: bills });
        // @pde on récupère tous les éléménts du DOM ayant pour ID "icon-eye"
        const iconEyes = screen.getAllByTestId("icon-eye"); 
        // @pde on gère les clics sur ces éléments
        const handleClickIconEye = jest.fn(billsPage.handleClickIconEye);
        // @pde on récupère tous les éléménts du DOM ayant pour ID "modaleFile"
        const modale = document.getElementById("modaleFile");

        $.fn.modal = jest.fn(() => modale.classList.add("show")); // @dpe mock de la modale Bootstrap
        // @pde on simule un clic sur chaque éléments
        iconEyes.forEach(iconEye => {
          iconEye.addEventListener("click", () => handleClickIconEye(iconEye));
          userEvent.click(iconEye);
          // @pde on vérifie que la fonction handleClickIconEye soit bien appelé 
          expect(handleClickIconEye).toHaveBeenCalled(); // @ pde on verifie que la fonction handleClickIconEye a bien été appelé
          // @pde on vérifie que le modale soit bien affiché
          expect(modale).toHaveClass("show"); // @pde on vérifie que l'élément modale à bien été affiché
        });
      });
    });
    // @pde test unitaire pour vérifier si la page se charge bien
    describe("When I went on Bills page and it is loading", () => {
      test("Then, Loading page should be rendered", () => {
        // @pde on simule l'ouverture de la page et on modifie le contenu HTML avec les paramètres de BillUI soit la value true
        document.body.innerHTML = BillsUI({ loading: true });
        /* @pde on vérifie si le texte Loading... est visible sur la page en utilisant 
        la fonction screen.getByText de la librairy "testing-library" */
        expect(screen.getByText("Loading...")).toBeVisible();
        // @pde on vide le contenu pour eviter les effets de bord dans le prochain test
        document.body.innerHTML = "";
      });
    });
    // @pde test unitaire pour vérifier si le message d'erreur s'affiche lorsque le serveur retourne une erreur
    describe("When I am on Bills page but back-end send an error message", () => {
      test("Then, Error page should be rendered", () => {
         // @pde on simule l'ouverture de la page et on modifie le contenu HTML avec les paramètres de BillUI soit un objet contenant  error: "error message"
        document.body.innerHTML = BillsUI({ error: "error message" });
        /* @pde on vérifie si le texte Erreur est visible sur la page en utilisant 
        la fonction screen.getByText de la librairy "testing-library"
        si le texte est visible c'est que la page erreutr est affiché */
        expect(screen.getByText("Erreur")).toBeVisible();
        // @pde on vide le contenu pour eviter les effets de bord dans le prochain test
        document.body.innerHTML = "";
      });
    });

    // @pde - Kanban 6 test d'intégration GET
    describe("When I navigate to Bills Page", () => {
      /* @pde dans ce premier test on vérifie que lorsque l'utilisateur navigue 
      vers la page bills, les bills sont correctement récupérées à partir 
      de API de simulation API GET */
      test("fetches bills from mock API GET", async () => {
        jest.spyOn(mockedStore, "bills");
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        localStorage.setItem(
          "user",
          JSON.stringify({ type: "Employee", email: "a@a" })
        );

        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.append(root);
        router();
        window.onNavigate(ROUTES_PATH.Bills);
        
        await waitFor(() => screen.getByText("Mes notes de frais"));
        const newBillBtn = await screen.findByRole("button", {
          name: /nouvelle note de frais/i,
        });
        
        const billsTableRows = screen.getByTestId("tbody");

        expect(newBillBtn).toBeTruthy();// @pde on vérifie l'existence d'un bouton "nouvelle note de frais" 
        expect(billsTableRows).toBeTruthy();// @pde on vérifie l'existence d'un tableau de factures
        expect(within(billsTableRows).getAllByRole("row")).toHaveLength(4);// @pde on vérifie que le tableau contient 4 éléments
      });
      /* on vérifie comment l'application gère les erreurs 404 
      lors de la récupération des factures à partir de l'API. 
      on utilise un mock de store pour simuler l'erreur avec 
      la méthode mockedStore.bills.mockImplementationOnce(() => {...}). 
      Cette méthode permet de remplacer la fonction originale list 
      dans le mock de store pour qu'elle renvoie une promesse 
      rejetée avec un message d'erreur "Erreur 404". */
      test("fetches bills from an API and fails with 404 message error", async () => {
        mockedStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"));
            },
          };
        });
        window.onNavigate(ROUTES_PATH.Bills);// @pde on simule la navigation de l'utilisateur vers la page Bills
        await new Promise(process.nextTick);// @pde on attend que la promesse soit résolue
        const message = screen.getByText(/Erreur 404/);// @pde on recherche le message d'erreur "Erreur 404" sur la page
        expect(message).toBeTruthy();// @pde on vérifie que le message est présent dans la page.
      });
      // @pde idem que le test précédent avec l'erreur 500
      test("fetches messages from an API and fails with 500 message error", async () => {
        mockedStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 500"));
            },
          };
        });

        window.onNavigate(ROUTES_PATH.Bills);// @pde on simule la navigation de l'utilisateur vers la page Bills
        await new Promise(process.nextTick);// @pde on attend que la promesse soit résolue
        const message = screen.getByText(/Erreur 500/);// @pde on recherche le message d'erreur "Erreur 500" sur la page
        expect(message).toBeTruthy();// @pde on vérifie que le message est présent dans la page.
      });
    });
  });
});
