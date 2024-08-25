using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace advect.io.Pages;

public class PlaygroundModel : PageModel
{
    private readonly ILogger<PlaygroundModel> _logger;

    public PlaygroundModel(ILogger<PlaygroundModel> logger)
    {
        _logger = logger;
    }

    public void OnGet()
    {
    }
}

