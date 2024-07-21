from ollama_python.endpoints import GenerateAPI

api = GenerateAPI(base_url="http://0.0.0.0:8000", model="mistral")

# Define a function to handle streaming responses
def generate_text_stream(prompt, options):
    for res in api.generate(prompt=prompt, options=options, format="json", stream=True):
        yield res.response

# Example usage
if __name__ == "__main__":
    prompt = "Hello World"
    options = {"num_tokens": 10}
    for generated_text in generate_text_stream(prompt, options):
        print(generated_text)

