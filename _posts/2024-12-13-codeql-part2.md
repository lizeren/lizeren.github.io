
  

# How to Use CodeQL (part 2)

  

## Running a bunch of queries
codeql starter workspace provides a bunch of useful premade queries. But what if I want to run all these queries at once and output results into a csv file? 
Naively, we will think of this command 
```bash
codeql database analyze   /home/lizeren/Desktop/codebase_codeql/libz-codeql-db \
/home/lizeren/Desktop/vscode-codeql-starter/ql/cpp/ql/src/Security/CWE   \
--format=csv   --output=results.csv
```
  In this command, `/home/lizeren/Desktop/codebase_codeql/libz-codeql-db`specifies what codebase we want to analyze. `/home/lizeren/Desktop/vscode-codeql-starter/ql/cpp/ql/src/Security/CWE` provides the path to queries. And the output will come out as csv format.
  When we run this, we see the following error
  ```bash
  Interpreting results. A fatal error occurred: Could not process query metadata for 
  /home/lizeren/Desktop/codebase_codeql/libz-codeql-db/results/codeql/cpp-queries/Security/CWE/CWE-
  020/IRCountUntrustedDataToExternalAPI.bqrs. Error was: Unknown kind "Table". [UNSUPPORTED_KIND]
```
The cause of this error is because `@kind` are intended for use by support tools such as IDE integration [source](https://github.com/github/codeql/discussions/13839)
This [post](https://codeql.github.com/docs/writing-codeql-queries/metadata-for-codeql-queries/?utm_source=chatgpt.com) talks about what the metadata properties of query and what is `@kind`.

## Whats the suggested way to do then?
Instead of running all `.ql` files directly, which might include queries designed for specific tools and contexts (e.g., IDE integrations or debugging), it's better to run predefined query suites (`.qls`) that are curated for specific purposes.
**1. Locate the `.qls` Files**
Navigate to the appropriate directory for your language (in our case, C++):
    `cd /home/lizeren/Desktop/vscode-codeql-starter/ql/cpp/ql/src/codeql-suites/`
**2. Run the `.qls` File**
```bash
codeql database analyze /home/lizeren/Desktop/codebase_codeql/libz-codeql-db /home/lizeren/Desktop/vscode-codeql-starter/ql/cpp/ql/src/codeql-suites/cpp-security-and-quality.qls --format=csv --output=results.csv
```
**3. View the result**
You can refer back to the [official documentation](https://docs.github.com/en/code-security/codeql-cli/using-the-advanced-functionality-of-the-codeql-cli/csv-output) to interpretate the result.

## Understand qls file
Take cpp-security-and-quality.qls as an example.
`- description: Security-and-quality queries for C and C++`, Provides a human-readable description of the query suite.
`- queries: .` Specifies that the suite should include all queries in the current directory (`.`). This would include all `.ql` files within the directory where the `.qls` file is located.
`- apply: security-and-quality-selectors.yml`
  `from: codeql/suite-helpers` 
Applies pre-defined selectors (filtering or prioritization rules) for security and quality queries. The `from` indicates that this selector is part of a helper pack (`suite-helpers`) in CodeQL.
`- apply: codeql-suites/exclude-slow-queries.yml` Excludes slow queries to optimize performance during analysis. This is especially helpful for large codebases where certain queries can significantly slow down the process. (this file is missing in the folder. Need to figure this out)

Here is the [official documentation](https://docs.github.com/en/code-security/codeql-cli/using-the-advanced-functionality-of-the-codeql-cli/creating-codeql-query-suites) about creating CodeQL query suites


## Understand yml file
This YAML file, `security-and-quality-selectors.yml`, defines selectors for filtering and applying CodeQL queries based on criteria such as their type (`kind`), precision, severity, and tags.

This YAML file, `security-and-quality-selectors.yml`, defines selectors for filtering and applying CodeQL queries based on criteria such as their type (`kind`), precision, severity, and tags. Here's a detailed breakdown:

----------

### **Explanation of the File**

#### **1. Description**
`description: Selectors for selecting the security-and-quality queries for a language` 
Provides a description for the selector file, indicating that it is meant to filter and select security-and-quality queries for a specific language.
#### **2. Query Inclusions**
These sections specify which queries should be included in the analysis based on their attributes.
### **Include Queries Based on `kind` and `precision`**
```yml
`- include:
    kind:
    - problem
    - path-problem
    precision:
    - high
    - very-high` 
```
-   **Kind**:
`problem`: Queries that identify potential security or quality issues.
`path-problem`: Queries that report issues and include data flow paths.
-   **Precision**:
- Includes only `high` and `very-high` precision queries to prioritize accuracy.

#### **3. Query Exclusions**

These sections exclude specific queries to avoid deprecated or experimental queries and focus on stable, relevant results.
### **Exclude Deprecated Queries**
```yml
`- exclude:
    deprecated: //` 
```
Excludes all queries marked as `deprecated` to ensure only actively maintained queries are included.
### **Exclude Specific Query Paths**

```yml
`- exclude:
    query path:
      - /^experimental\/.*/
      - Metrics/Summaries/FrameworkCoverage.ql
      - /Diagnostics/Internal/.*/` 
```
Excludes queries in the `experimental` directory, specific metrics like `FrameworkCoverage.ql`, and internal diagnostics queries.

### **Exclude Queries with Certain Tags**

```yml
`- exclude:
    tags contain:
      - modeleditor
      - modelgenerator` 
```
Excludes queries tagged with `modeleditor` or `modelgenerator`, which are typically used for internal tooling or query generation.

Note: You can use the codeql resolve queries /path/to/suite.qls command to see which queries are selected by a query suite definition.