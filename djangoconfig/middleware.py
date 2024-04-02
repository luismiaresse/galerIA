# This middleware is used to enable Cross-Origin-Embedder-Policy header in the response
class COEPMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        response = self.get_response(request)
        # Enable COEP header
        response["Cross-Origin-Embedder-Policy"] = 'require-corp; report-to="default"'
        return response