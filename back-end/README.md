# Phase 2 deliverables

In this part, you will implement the Django backend of Easy Chef. All user stories are implemented with one or more REST APIs. Your APIs should not have any template or HTML response.

The project should run in a python virtual environment, with all the packages listed in the requirements file. Ideally, your backend server should not go through many changes at the next part (this will not happen in practice).

You should implement proper authentication and authorization for the user stories as well. All your API views must work with the Token auth. You can also support session auth, but it's optional.

Note 1: As potentially ambiguous as the handout gets, you can ask your questions on Piazza or discuss them with TAs at mentor sessions.

Note 2: It is recommended that you replace the Django's default User model with a custom model that meets the requirements of this handout. Your new model can extend the default one, or have a one-to-one relation with it. [These instructions](https://docs.djangoproject.com/en/4.1/topics/auth/customizing/#substituting-a-custom-user-model) helps Django recognize your custom model as the auth model so that all User-specific functionalities (sessions, tokens, etc.) still work.

Note 3: All API views that return a potentially long list of items (e.g., search results, my recipes, recommended recipes, etc.) must be paginated so that a reasonable amount of data is returned in one response. Read more information [here](https://www.django-rest-framework.org/api-guide/pagination/).

Note 4: Your need to handle the autocomplete functionality at backend (as opposed to sending all the ingredients to the frontend and letting the browser search through it). 


# Submission

You should push your entire Django project to your repo for P2 on Gitlab, accompanied by a startup.sh script, a run.sh script, a docs.pdf file, and a postman.json collection. These files should be located in the root folder of your repository. Find out your group's repo by logging into the [IBS](https://q.utoronto.ca/courses/291539/pages/ibs-submissions-grades-and-interviews). Note that your repo for P2 is different from that of P1.

The startup script should run any preparation needed for your code to run in a new environment. It should create the virtual environment, install all required packages with pip, and run all migrations. The run script should start your server. Finally, your documentation must include your design of models, as well as the full list of all API endpoints, a short description, their methods, and the payloads. You can use packages that automatically generate the API docs from your code. 

The TA will send requests based on the information you provide on that document. Therefore, it is important to have a usable and clear document. The postman collection must be an export of all the APIs that are importable into Postman. The TA will use Postman to test your APIs, so it is important that your collection is comprehensive, well-organized, and self-explanatory. All the POST data, headers, and GET query parameters must be pre-filled and editable in that collection.

Note: Before submitting, make sure that your startup and run scripts work well on a Ubuntu (preferably 20.04) machine, and your collection can be imported into Postman without any issues. The TAs will run your application on clean instances of that environment. If you have worked with another operating system, it is your absolute responsibility to double-check that your project works fine within the Ubuntu environment as well.

Note 2: You can assume that python3.10, pip and virtualenv (accessible via python3.10 -m) is already installed on the test machines. So do not try to install them in your startup script.

Note 3: Make sure that you postman collection uses environment variables for auth tokens. Otherwise, the TAs would have to copy-paste the token every single time.
